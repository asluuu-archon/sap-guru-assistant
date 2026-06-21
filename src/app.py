from fastapi import FastAPI, Request, Query
from pydantic import BaseModel
import os

from .assistant import suggest_reply
from .instagram import send_instagram_reply
from .memory import get_conversation, build_context, save_conversation

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


@app.post("/webhook")
async def receive_webhook(request: Request):
    data = await request.json()

    print("========== WEBHOOK ==========", flush=True)
    print(data, flush=True)

    try:
        entry = data.get("entry", [{}])[0]

        # Ignore comment webhooks and other non-DM events
        if "messaging" not in entry:
            print("Ignoring non-DM webhook", flush=True)
            return {"status": "ignored_non_dm"}

        messaging = entry["messaging"][0]

        # Ignore read receipts / delivery events
        if "message" not in messaging:
            print("Ignoring non-message event", flush=True)
            return {"status": "ignored_non_message"}

        sender_id = messaging["sender"]["id"]
        message = messaging.get("message", {})

        # Ignore our own sent messages
        if message.get("is_echo"):
            print("Ignoring own echo message", flush=True)
            return {"status": "ignored_echo"}

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