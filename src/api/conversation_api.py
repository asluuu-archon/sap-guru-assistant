from fastapi import APIRouter
from pydantic import BaseModel

from ..services.reply_service import send_reply
from ..memory import (
    get_conversation,
    mark_manual_replied,
)

router = APIRouter()


class ManualReplyRequest(BaseModel):
    sender_id: str
    message: str


@router.get("/conversation/{sender_id}")
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


@router.post("/conversation/send-reply")
def send_manual_reply_from_dashboard(req: ManualReplyRequest):
    try:
        if not req.sender_id or not req.message.strip():
            return {
                "status": "error",
                "message": "sender_id and message are required",
            }

        result = send_reply(
            channel="instagram",
            recipient_id=req.sender_id,
            message=req.message.strip(),
        )

        print(f"DASHBOARD SEND RESULT: {result}", flush=True)
        mark_manual_replied(req.sender_id, req.message.strip())

        return {
            "status": "success",
            "message": "Reply sent successfully",
            "result": result,
        }

    except Exception as e:
        print(f"DASHBOARD SEND REPLY ERROR: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
        }