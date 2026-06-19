from fastapi import FastAPI, Request, Query
from pydantic import BaseModel
import os
from datetime import datetime

from .assistant import suggest_reply
from .instagram import send_instagram_reply

app = FastAPI(title="SAP Guru Assistant", version="pilot_2")

VERIFY_TOKEN = "sap_guru_2026"
AUTO_REPLY = os.getenv("AUTO_REPLY", "false").lower() == "true"

processed_message_ids = set()
conversation_memory = {}


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


def get_user_context(sender_id: str) -> str:
    history = conversation_memory.get(sender_id, [])
    if not history:
        return ""

    recent = history[-8:]
    lines = []
    for item in recent:
        lines.append(f"User: {item['user']}")
        lines.append(f"Assistant: {item['assistant']}")

    return "\n".join(lines)


def save_conversation(sender_id: str, user_message: str, assistant_reply: str):
    if sender_id not in conversation_memory:
        conversation_memory[sender_id] = []

    conversation_memory[sender_id].append({
        "time": datetime.utcnow().isoformat(),
        "user": user_message,
        "assistant": assistant_reply
    })

    conversation_memory[sender_id] = conversation_memory[sender_id][-20:]


def is_repeated_reply(sender_id: str, reply_text: str) -> bool:
    history = conversation_memory.get(sender_id, [])
    recent_replies = [item["assistant"].strip().lower() for item in history[-5:]]
    return reply_text.strip().lower() in recent_replies


@app.post("/webhook")
async def receive_webhook(request: Request):
    data = await request.json()

    print("========== WEBHOOK ==========", flush=True)
    print(data, flush=True)

    try:
        messaging = data["entry"][0]["messaging"][0]

        message = messaging.get("message", {})
        sender_id = messaging["sender"]["id"]
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
            if AUTO_REPLY:
                send_instagram_reply(sender_id, reply_text)
            return {"status": "non_text_handled"}

        previous_context = get_user_context(sender_id)

        context = f"""
Previous conversation with this user:
{previous_context}

Important:
- Do not repeat the same question if already asked.
- Continue from previous context.
- Reply in English even if user writes Malayalam/Hindi/Tamil in English letters.
- If unclear, ask one short clarification question.
"""

        reply = suggest_reply(message_text, "instagram", context)
        reply_text = reply.get("suggested_reply", "I will check and update.")

        if is_repeated_reply(sender_id, reply_text):
            reply_text = "Can you share a little more detail so I can suggest properly?"

        print(f"SENDER: {sender_id}", flush=True)
        print(f"MESSAGE: {message_text}", flush=True)
        print(f"REPLY: {reply_text}", flush=True)

        save_conversation(sender_id, message_text, reply_text)

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