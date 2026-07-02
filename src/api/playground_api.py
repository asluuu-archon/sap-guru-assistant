from fastapi import APIRouter
from pydantic import BaseModel

from ..pipeline.message_pipeline import process_incoming_message
from ..playground import (
    save_playground_result,
    get_playground_history,
)

router = APIRouter()


class PlaygroundTestRequest(BaseModel):
    message: str
    sender_id: str = "playground_test_user"
    channel: str = "playground"


@router.post("/playground/test-message")
def playground_test_message(req: PlaygroundTestRequest):
    try:
        result = process_incoming_message(
            organization_id=1,
            channel=req.channel,
            sender_id=req.sender_id,
            message_text=req.message,
            raw_payload={
                "source": "ai_playground",
                "message": req.message,
            },
        )

        playground_result = {
            "message": req.message,
            "sender_id": req.sender_id,
            "channel": req.channel,
            "intent": result.get("intent"),
            "lead": result.get("lead"),
            "decision": result.get("decision"),
            "reply": result.get("reply"),
            "ai_memory": result.get("ai_memory"),
            "logs": result.get("logs"),
            "timings": result.get("timings"),
        }

        save_playground_result(playground_result)

        return {
            "status": "success",
            **playground_result,
        }

    except Exception as e:
        print(f"PLAYGROUND TEST ERROR: {e}", flush=True)
        return {
            "status": "error",
            "message": str(e),
        }


@router.get("/playground/history")
def playground_history():
    return {
        "history": get_playground_history()
    }