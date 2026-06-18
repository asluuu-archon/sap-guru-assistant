from fastapi import FastAPI, Request
from pydantic import BaseModel
from .assistant import suggest_reply


app = FastAPI(title="SAP Guru Assistant", version="pilot_1")

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

VERIFY_TOKEN = "sap_guru_2026"

@app.get("/webhook")
def verify_webhook(
    hub_mode: str = None,
    hub_challenge: str = None,
    hub_verify_token: str = None
):
    if hub_mode == "subscribe" and hub_verify_token == VERIFY_TOKEN:
        return int(hub_challenge)
    return {"error": "Verification failed"}


@app.post("/webhook")
async def receive_webhook(request: Request):
    body = await request.json()
    print("Instagram webhook received:", body)
    return {"status": "received"}
