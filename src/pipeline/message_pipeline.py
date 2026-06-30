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
(Return to app.py)

Future stages:
- Conversation
- Business Brain
- Intent
- Reply
- Lead
"""

from .models.message_context import MessageContext
from .stages.customer_stage import run_customer_stage
from .stages.identity_stage import run_identity_stage


def process_incoming_message(
    organization_id: int,
    channel: str,
    sender_id: str,
    message_text: str,
    raw_payload: dict | None = None,
) -> dict:
    """
    Main entry point for the Message Pipeline.
    """

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

    # -----------------------------------
    # Customer Stage
    # -----------------------------------

    customer_result = run_customer_stage(
        organization_id=context.organization_id,
        channel=context.channel,
        sender_id=context.sender_id,
    )

    context.customer = customer_result.get("customer") or {}
    context.customer_id = customer_result.get("customer_id")

    context.add_log("Customer Stage completed")

    # -----------------------------------
    # Identity Stage
    # -----------------------------------

    identity_result = run_identity_stage(
        customer_id=context.customer_id,
        channel=context.channel,
        sender_id=context.sender_id,
        raw_payload=context.raw_payload,
    )

    context.identity = identity_result.get("identity") or {}

    context.add_log("Identity Stage completed")

    # -----------------------------------
    # Return
    # -----------------------------------

    result = context.to_dict()
    result["status"] = "success"

    return result