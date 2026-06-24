from fastapi import FastAPI, Request, Query
from pydantic import BaseModel
import os
import re

from .assistant import suggest_reply
from .instagram import send_instagram_reply
from .memory import get_conversation, build_context, save_conversation, supabase
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


@app.get("/health")
def health():
    return {"status": "ok", "auto_reply": AUTO_REPLY}


@app.get("/run-delayed-replies")
def run_delayed_replies():
    return process_pending_replies()


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


def detect_lead_intent(text: str, reply: dict) -> bool:
    lower = (text or "").lower().strip()

    weak_messages = {
        "hi",
        "hii",
        "hello",
        "hey",
        "ok",
        "okay",
        "yes",
        "no",
        "thanks",
        "thank you",
        "sure",
        "fine",
        "good",
        "great",
        "noted",
        "done",
        "welcome",
        "oh its ok",
        "oh it's ok",
    }

    if lower in weak_messages:
        return False

    if extract_phone(text) or extract_email(text):
        return True

    strong_lead_phrases = [
        "want to learn",
        "interested in learning",
        "learn sap",
        "how to learn sap",
        "want to join",
        "course details",
        "fee details",
        "fees",
        "online class",
        "offline class",
        "contact me",
        "call me",
        "internship",
        "mentorship",
        "career guidance",
        "placement support",
    ]

    if any(phrase in lower for phrase in strong_lead_phrases):
        return True

    return reply.get("should_capture_contact") is True


def save_possible_lead(sender_id: str, message_text: str, reply: dict, category: str):
    if not detect_lead_intent(message_text, reply):
        return

    phone = extract_phone(message_text)
    email = extract_email(message_text)

    save_lead(
        sender_id=sender_id,
        phone=phone,
        email=email,
        interested_module=category,
        notes=message_text,
    )


def should_ignore_manual_reply(manual_reply_text: str) -> bool:
    text = (manual_reply_text or "").lower().strip()

    junk_replies = [
        "please send your question as text",
        "i can reply properly",
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

def is_closing_message(text: str) -> bool:
    lower = (text or "").lower().strip()

    closing_messages = {
        "ok",
        "okay",
        "oh ok",
        "oh okay",
        "okk",
        "ok bro",
        "ok brother",
        "ok sir",
        "okay sir",
        "sure",
        "fine",
        "good",
        "great",
        "thanks",
        "thank you",
        "thankyou",
        "thank u",
        "tq",
        "ty",
        "got it",
        "understood",
        "noted",
        "no problem",
        "np",
        "👍",
        "🙏",
    }

    if lower in closing_messages:
        return True

    if lower.replace(".", "").replace("!", "") in closing_messages:
        return True

    return False

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

                supabase_payload = {
                    "sender_id": target_user_id,
                    "manual_replied": True,
                    "pending_reply": False,
                    "last_reply": manual_reply_text,
                }

                supabase.table("conversations").upsert(supabase_payload).execute()
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
            return {"status": "non_text_ignored"}

        if is_closing_message(message_text):
            print("Closing message received. Staying silent.", flush=True)

            supabase.table("conversations").update({
                "pending_reply": False,
                "ai_replied": False,
                "manual_replied": False,
            }).eq("sender_id", sender_id).execute()

            return {"status": "closing_message_ignored"}

        conversation = get_conversation(sender_id)
        context = build_context(conversation)

        reply = suggest_reply(message_text, "instagram", context)
        reply_text = reply.get("suggested_reply", "I will check and update.")
        category = reply.get("category", "general")

        print(f"SENDER: {sender_id}", flush=True)
        print(f"CONTEXT: {context}", flush=True)
        print(f"MESSAGE: {message_text}", flush=True)
        print(f"REPLY: {reply_text}", flush=True)

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