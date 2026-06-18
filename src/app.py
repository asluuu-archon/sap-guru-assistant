from fastapi import FastAPI, Request, Query
from pydantic import BaseModel

from .assistant import suggest_reply
from .instagram import send_instagram_reply

app = FastAPI(title="SAP Guru Assistant", version="pilot_1")

processed_message_ids = set()
VERIFY_TOKEN = "sap_guru_2026"


class SuggestRequest(BaseModel):
    message: str
    channel: str = "instagram"
    context: str = ""


@app.get("/health")
def health():
    return {"status": "ok"}


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
        messaging = data["entry"][0]["messaging"][0]

        message = messaging.get("message", {})
        message_id = message.get("mid")
        message_text = message.get("text")
        sender_id = messaging["sender"]["id"]

        if not message_id:
            print("No message ID found. Skipping.", flush=True)
            return {"status": "ignored"}

        if message_id in processed_message_ids:
            print(f"Duplicate message ignored: {message_id}", flush=True)
            return {"status": "duplicate_ignored"}

        processed_message_ids.add(message_id)

        if not message_text:
            send_instagram_reply(
                sender_id,
                "Please send your question as text so I can reply properly.",
            )
            return {"status": "non_text_handled"}

        print(f"SENDER: {sender_id}", flush=True)
        print(f"MESSAGE: {message_text}", flush=True)

        reply = suggest_reply(message_text, "instagram", "")
        reply_text = reply.get("suggested_reply", "Thanks, I will check and reply.")

        print(f"REPLY: {reply_text}", flush=True)

        send_instagram_reply(sender_id, reply_text)

        return {"status": "received"}

    except Exception as e:
        print(f"ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}