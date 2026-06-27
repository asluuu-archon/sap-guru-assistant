from fastapi import FastAPI, Request, Query
from pydantic import BaseModel
import os
import re

from .assistant import suggest_reply
from .instagram import send_instagram_reply
from .memory import (
    get_conversation,
    build_context,
    save_conversation,
    mark_manual_replied,
    mark_needs_human,
    mark_closed,
    supabase,
)
from .reply_bank import save_manual_reply_to_bank
from .leads import save_lead
from .delay_processor import process_pending_replies

app = FastAPI(title="SAP Guru Assistant", version="pilot_3")

VERIFY_TOKEN = "sap_guru_2026"
AUTO_REPLY = os.getenv("AUTO_REPLY", "false").lower() == "true"

processed_message_ids = set()


class SuggestRequest(BaseModel):
    message: str
    channel: str = "instagram"
    context: str = ""

class ManualReplyRequest(BaseModel):
    sender_id: str
    message: str


@app.get("/health")
def health():
    return {"status": "ok", "auto_reply": AUTO_REPLY}


@app.get("/run-delayed-replies")
def run_delayed_replies():
    return process_pending_replies()

@app.get("/conversation/{sender_id}")
def get_conversation_detail(sender_id: str):
    try:
        conversation = get_conversation(sender_id)

        return {
            "status": "success",
            "sender_id": sender_id,
            "conversation": conversation,
        }

    except Exception as e:
        print(f"CONVERSATION DETAIL ERROR: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
        }

@app.post("/conversation/send-reply")
def send_manual_reply_from_dashboard(req: ManualReplyRequest):
    try:
        if not req.sender_id or not req.message.strip():
            return {
                "status": "error",
                "message": "sender_id and message are required",
            }

        send_instagram_reply(req.sender_id, req.message.strip())
        mark_manual_replied(req.sender_id, req.message.strip())

        return {
            "status": "success",
            "message": "Reply sent successfully",
        }

    except Exception as e:
        print(f"DASHBOARD SEND REPLY ERROR: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
        }


@app.get("/dashboard-data")
def dashboard_data():
    conversations_result = (
        supabase.table("conversations")
        .select("*")
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    )

    leads_result = (
        supabase.table("leads")
        .select("*")
        .order("updated_at", desc=True)
        .limit(100)
        .execute()
    )

    conversations = conversations_result.data or []
    leads = leads_result.data or []

    needs_human = [
        row for row in conversations
        if row.get("needs_human") is True
        or row.get("conversation_state") == "needs_human"
    ]

    lead_collection = [
        row for row in conversations
        if row.get("conversation_state") == "lead_collection"
    ]

    qualified_leads = [
        row for row in leads
        if row.get("is_qualified") is True
        or row.get("status") == "qualified"
        or row.get("lead_stage") == "qualified"
    ]

    recent_conversations = conversations[:30]

    return {
        "counts": {
            "needs_human": len(needs_human),
            "lead_collection": len(lead_collection),
            "qualified_leads": len(qualified_leads),
            "recent_conversations": len(recent_conversations),
            "total_leads": len(leads),
            "total_conversations": len(conversations),
        },
        "needs_human": needs_human[:30],
        "lead_collection": lead_collection[:30],
        "qualified_leads": qualified_leads[:30],
        "recent_conversations": recent_conversations,
    }


@app.post("/suggest")
def suggest(req: SuggestRequest):
    return suggest_reply(req.message, req.channel, req.context)


@app.get("/webhook")
def verify_webhook(
    hub_mode: str = Query(None, alias="hub.mode"),
    hub_challenge: str = Query(None, alias="hub.challenge"),
    hub_verify_token: str = Query(None, alias="hub.verify_token"),
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)

    return {"error": "Verification failed"}


def extract_phone(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s\-]{8,}\d)", text or "")
    return match.group(1).strip() if match else ""


def extract_email(text: str) -> str:
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text or "")
    return match.group(0).strip() if match else ""


def is_closing_message(text: str) -> bool:
    lower = (text or "").lower().strip()

    closing_messages = {
        "ok", "okay", "oh ok", "oh okay", "okk",
        "ok bro", "ok brother", "ok sir", "okay sir",
        "sure", "fine", "good", "great",
        "thanks", "thank you", "thankyou", "thank u",
        "tq", "ty", "got it", "understood", "noted",
        "no problem", "np", "👍", "🙏",
    }

    cleaned = lower.replace(".", "").replace("!", "").strip()
    return lower in closing_messages or cleaned in closing_messages


def detect_lead_intent(text: str, reply: dict) -> bool:
    lower = (text or "").lower().strip()

    weak_messages = {
        "hi", "hii", "hello", "hey", "ok", "okay",
        "yes", "no", "thanks", "thank you", "sure",
        "fine", "good", "great", "noted", "done",
        "welcome", "oh its ok", "oh it's ok",
    }

    if lower in weak_messages:
        return False

    if extract_phone(text) or extract_email(text):
        return True

    strong_lead_phrases = [
        "want to learn", "interested in learning", "learn sap",
        "how to learn sap", "want to join", "course details",
        "fee details", "fees", "online class", "offline class",
        "contact me", "call me", "internship", "mentorship",
        "career guidance", "placement support",
    ]

    if any(phrase in lower for phrase in strong_lead_phrases):
        return True

    return reply.get("should_capture_contact") is True


def save_possible_lead(sender_id: str, message_text: str, reply: dict, category: str):
    if not detect_lead_intent(message_text, reply):
        return

    save_lead(
        sender_id=sender_id,
        phone=extract_phone(message_text),
        email=extract_email(message_text),
        interested_module=category,
        notes=message_text,
    )


def should_ignore_manual_reply(manual_reply_text: str) -> bool:
    text = (manual_reply_text or "").lower().strip()

    junk_replies = [
        "please send your question as text",
        "i can reply properly",
        "i will check and update",
    ]

    short_replies = {
        "",
        "ok",
        "okay",
        "thanks",
        "thank you",
        "sure",
        "noted",
    }

    return text in short_replies or any(junk in text for junk in junk_replies)


@app.post("/webhook")
async def receive_webhook(request: Request):
    data = await request.json()

    print("========== WEBHOOK ==========", flush=True)
    print(data, flush=True)

    try:
        entry = data.get("entry", [{}])[0]

        if "messaging" not in entry:
            print("Ignoring non-DM webhook", flush=True)
            return {"status": "ignored_non_dm"}

        messaging = entry["messaging"][0]

        if "message" not in messaging:
            print("Ignoring non-message event", flush=True)
            return {"status": "ignored_non_message"}

        sender_id = messaging["sender"]["id"]
        recipient_id = messaging["recipient"]["id"]
        message = messaging.get("message", {})

        if message.get("is_echo"):
            manual_reply_text = message.get("text", "")
            target_user_id = recipient_id

            if should_ignore_manual_reply(manual_reply_text):
                print("Manual echo ignored. Not useful for learning.", flush=True)
                return {"status": "manual_reply_ignored"}

            conversation = get_conversation(target_user_id)
            history = conversation.get("history") or []

            last_user_message = ""
            for item in reversed(history):
                if item.get("user"):
                    last_user_message = item.get("user")
                    break

            if last_user_message and manual_reply_text:
                save_manual_reply_to_bank(
                    user_question=last_user_message,
                    sap_guru_reply=manual_reply_text,
                    category="manual",
                    tags="manual_reply",
                )

                mark_manual_replied(target_user_id, manual_reply_text)
                print("MANUAL REPLY LEARNED", flush=True)
            else:
                print("Manual echo found but no matching user message", flush=True)

            return {"status": "manual_reply_learned"}

        message_id = message.get("mid")
        message_text = message.get("text")

        if not message_id:
            print("No message ID found. Skipping.", flush=True)
            return {"status": "ignored"}

        if message_id in processed_message_ids:
            print(f"Duplicate ignored: {message_id}", flush=True)
            return {"status": "duplicate_ignored"}

        processed_message_ids.add(message_id)

        if not message_text:
            print("Non-text message received. Staying silent.", flush=True)
            mark_needs_human(sender_id, "Non-text message received.")
            return {"status": "non_text_needs_human"}

        if is_closing_message(message_text):
            print("Closing message received. Staying silent.", flush=True)
            mark_closed(sender_id, "Closing message received.")
            return {"status": "closing_message_ignored"}

        conversation = get_conversation(sender_id)
        context = build_context(conversation)

        reply = suggest_reply(message_text, "instagram", context)
        reply_text = reply.get("suggested_reply", "")
        category = reply.get("category", "general")
        should_reply = reply.get("should_reply", True)

        print(f"SENDER: {sender_id}", flush=True)
        print(f"CONTEXT: {context}", flush=True)
        print(f"MESSAGE: {message_text}", flush=True)
        print(f"REPLY: {reply_text}", flush=True)
        print(f"SHOULD_REPLY: {should_reply}", flush=True)

        if should_reply is False or not reply_text:
            reason = reply.get("human_reason", "Low confidence or unclear message.")
            print(f"NEEDS HUMAN: {reason}", flush=True)

            save_conversation(sender_id, message_text, "", "needs_human")
            mark_needs_human(sender_id, reason)

            return {
                "status": "needs_human",
                "reason": reason,
                "auto_reply": False,
            }

        save_conversation(sender_id, message_text, reply_text, category)

        save_possible_lead(
            sender_id=sender_id,
            message_text=message_text,
            reply=reply,
            category=category,
        )

        if AUTO_REPLY:
            send_instagram_reply(sender_id, reply_text)
            print("AUTO REPLY SENT", flush=True)
        else:
            print("AUTO REPLY DISABLED", flush=True)
            print(f"WOULD HAVE SENT: {reply_text}", flush=True)

        return {"status": "received", "auto_reply": AUTO_REPLY}

    except Exception as e:
        print(f"ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}