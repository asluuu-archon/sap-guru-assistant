"""
Message Pipeline

Central orchestrator for incoming messages.
Phase 3: Uses MessageContext + Customer Stage.
"""

from .models.message_context import MessageContext
from .stages.customer_stage import run_customer_stage


def process_incoming_message(
    organization_id: int,
    channel: str,
    sender_id: str,
    message_text: str,
    raw_payload: dict | None = None,
) -> dict:
    context = MessageContext(
        organization_id=organization_id or 1,
        channel=channel or "instagram",
        sender_id=sender_id or "",
        message_text=message_text or "",
        raw_payload=raw_payload or {},
    )

    if not context.sender_id:
        return {
            "status": "error",
            "message": "sender_id is required",
        }

    customer_result = run_customer_stage(
        organization_id=context.organization_id,
        channel=context.channel,
        sender_id=context.sender_id,
    )

    context.customer = customer_result.get("customer") or {}
    context.customer_id = customer_result.get("customer_id")
    context.add_log("Customer Stage completed")

    result = context.to_dict()
    result["status"] = "success"

    return result