"""
Message Pipeline

Central orchestrator for incoming messages.

Current Flow

Incoming Event
        ↓
MessageContext
        ↓
Customer Stage
        ↓
Identity Stage
        ↓
Conversation Stage
        ↓
(Return to app.py)

Future stages:
- Customer Brain
- Business Brain
- Intent
- Reply
- Lead
"""

from .models.message_context import MessageContext
from .stages.customer_stage import run_customer_stage
from .stages.identity_stage import run_identity_stage
from .stages.conversation_stage import run_conversation_stage


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

    identity_result = run_identity_stage(
        customer_id=context.customer_id,
        channel=context.channel,
        sender_id=context.sender_id,
        raw_payload=context.raw_payload,
    )

    context.identity = identity_result.get("identity") or {}
    context.add_log("Identity Stage completed")

    conversation_result = run_conversation_stage(
        sender_id=context.sender_id,
    )

    context.conversation = conversation_result.get("conversation") or {}
    context.add_log(
        f"Conversation Stage completed. Returning: {conversation_result.get('is_returning_conversation')}"
    )

    result = context.to_dict()
    result["status"] = "success"
    result["history_count"] = conversation_result.get("history_count", 0)
    result["is_returning_conversation"] = conversation_result.get(
        "is_returning_conversation",
        False,
    )

    return result