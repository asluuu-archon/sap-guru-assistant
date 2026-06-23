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
    lower = (text or "").lower()

    lead_words = [
        "learn",
        "course",
        "program",
        "join",
        "interested",
        "mentorship",
        "guidance",
        "internship",
        "classes",
        "online",
        "offline",
        "fees",
        "fee",
        "contact",
        "call",
        "sap mm",
        "sap fico",
        "sap sd",
        "sap abap",
        "sap hcm",
        "successfactors",
        "sap ewm",
        "sap btp",
    ]

    return (
        reply.get("should_capture_contact") is True
        or any(word in lower for word in lead_words)
        or bool(extract_phone(text))
        or bool(extract_email(text))
    )


def save_possible_lead(sender_id: str, message_text: str, reply: dict, category: str):
    phone = extract_phone(message_text)
    email = extract_email(message_text)

    if not detect_lead_intent(message_text, reply):
        return

    save_lead(
        sender_id=sender_id,
        phone=phone,
        email=email,
        interested_module=category,
        notes=message_text,
    )


@app.post("/webhook")
async def receive_webhook(request: Request):
    data = await request.json()

    print("========== WEBHOOK ==========", flush=True)
    print(data, flush=True)

    try:
        entry = data.get("entry", [{}])[0]

        # Ignore comment webhooks and other non-DM events for now
        if "messaging" not in entry:
            print("Ignoring non-DM webhook", flush=True)
            return {"status": "ignored_non_dm"}

        messaging = entry["messaging"][0]

        # Ignore read receipts / delivery events
        if "message" not in messaging:
            print("Ignoring non-message event", flush=True)
            return {"status": "ignored_non_message"}

        sender_id = messaging["sender"]["id"]
        recipient_id = messaging["recipient"]["id"]
        message = messaging.get("message", {})

        # Manual replies sent by Mohamed from Instagram arrive as echo messages
        if message.get("is_echo"):
            manual_reply_text = message.get("text", "")
            target_user_id = recipient_id

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
            reply_text = "Please send your question as text so I can reply properly."
            save_conversation(sender_id, "[non-text message]", reply_text, "non_text")

            if AUTO_REPLY:
                send_instagram_reply(sender_id, reply_text)

            return {"status": "non_text_handled"}

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