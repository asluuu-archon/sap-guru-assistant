from fastapi import APIRouter
from pydantic import BaseModel

from ..assistant import suggest_reply

router = APIRouter()


class SuggestRequest(BaseModel):
    message: str
    channel: str = "instagram"
    context: str = ""


@router.post("/suggest")
def suggest(req: SuggestRequest):
    return suggest_reply(req.message, req.channel, req.context)