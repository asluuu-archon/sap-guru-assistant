"""
Message Pipeline

Central orchestrator for incoming business events.

Current Flow:
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
Business Brain Stage

Pipeline v2 direction:
The pipeline should internally work with MessageContext.
For now, process_incoming_message still returns dict so app.py does not break.
"""

from .models.message_context import MessageContext
from .stages.customer_stage import run_customer_stage
from .stages.identity_stage import run_identity_stage
from .stages.conversation_stage import run_conversation_stage
from .stages.business_brain_stage import run_business_brain_stage


def build_message_context(
    organization_id: int,
    channel: str,
    sender_id: str,
    message_text: str,
    raw_payload: dict | None = None,
) -> MessageContext:
    """
    Create the shared MessageContext object.
    """

    return MessageContext(
        organization_id=organization_id or 1,
        channel=channel or "instagram",
        sender_id=sender_id or "",
        message_text=message_text or "",
        raw_payload=raw_payload or {},
    )


def run_pipeline(context: MessageContext) -> MessageContext:
    """
    Runs all connected pipeline stages and returns enriched MessageContext.
    """

    if not context.sender_id:
        context.add_log("Pipeline stopped: sender_id missing")
        return context

    # Customer Stage
    customer_result = run_customer_stage(
        organization_id=context.organization_id,
        channel=context.channel,
        sender_id=context.sender_id,
    )

    context.customer = customer_result.get("customer") or {}
    context.customer_id = customer_result.get("customer_id")
    context.add_log("Customer Stage completed")

    # Identity Stage
    identity_result = run_identity_stage(
        customer_id=context.customer_id,
        channel=context.channel,
        sender_id=context.sender_id,
        raw_payload=context.raw_payload,
    )

    context.identity = identity_result.get("identity") or {}
    context.add_log("Identity Stage completed")

    # Conversation Stage
    conversation_result = run_conversation_stage(
        sender_id=context.sender_id,
    )

    context.conversation = conversation_result.get("conversation") or {}
    context.add_log(
        f"Conversation Stage completed. Returning: {conversation_result.get('is_returning_conversation')}"
    )

    # Business Brain Stage
    business_result = run_business_brain_stage(
        organization_id=context.organization_id,
    )

    context.business_context = business_result.get("business_context", "")
    context.add_log(
        f"Business Brain Stage completed. Active: {business_result.get('has_business_context')}"
    )

    return context


def process_incoming_message(
    organization_id: int,
    channel: str,
    sender_id: str,
    message_text: str,
    raw_payload: dict | None = None,
) -> dict:
    """
    Backward-compatible function used by app.py.

    It returns dict for now.
    Later app.py will directly use MessageContext.
    """

    context = build_message_context(
        organization_id=organization_id,
        channel=channel,
        sender_id=sender_id,
        message_text=message_text,
        raw_payload=raw_payload,
    )

    if not context.sender_id:
        return {
            "status": "error",
            "message": "sender_id is required",
            "logs": context.logs,
        }

    context = run_pipeline(context)

    result = context.to_dict()
    result["status"] = "success"

    return result