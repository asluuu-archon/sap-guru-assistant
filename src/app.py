from fastapi import FastAPI
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
