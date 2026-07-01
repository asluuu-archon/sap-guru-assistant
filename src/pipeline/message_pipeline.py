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
↓
Customer Brain Stage
↓
Intent Stage
"""

from .models.message_context import MessageContext
from .stages.customer_stage import run_customer_stage
from .stages.identity_stage import run_identity_stage
from .stages.conversation_stage import run_conversation_stage
from .stages.business_brain_stage import run_business_brain_stage
from .stages.customer_brain_stage import run_customer_brain_stage
from .stages.intent_stage import run_intent_stage


def build_message_context(
    organization_id: int,
    channel: str,
    sender_id: str,
    message_text: str,
    raw_payload: dict | None = None,
) -> MessageContext:
    return MessageContext(
        organization_id=organization_id or 1,
        channel=channel or "instagram",
        sender_id=sender_id or "",
        message_text=message_text or "",
        raw_payload=raw_payload or {},
    )


def run_pipeline(context: MessageContext) -> MessageContext:
    if not context.sender_id:
        context.add_log("Pipeline stopped: sender_id missing")
        return context

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

    business_result = run_business_brain_stage(
        organization_id=context.organization_id,
    )

    context.business_context = business_result.get("business_context", "")
    context.add_log(
        f"Business Brain Stage completed. Active: {business_result.get('has_business_context')}"
    )

    customer_brain_result = run_customer_brain_stage(
        customer_id=context.customer_id,
        message_text=context.message_text,
    )

    context.add_log(
        f"Customer Brain Stage completed. Facts found: {customer_brain_result.get('facts_found')}"
    )

    intent_result = run_intent_stage(
        message_text=context.message_text,
    )

    context.intent = intent_result.get("intent") or {}
    context.add_log(
        f"Intent Stage completed. Intent: {intent_result.get('intent_name')}"
    )

    return context


def process_incoming_message(
    organization_id: int,
    channel: str,
    sender_id: str,
    message_text: str,
    raw_payload: dict | None = None,
) -> dict:
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