"""
Message Pipeline

Central orchestrator for incoming business events.
"""

from .models.message_context import MessageContext
from .stages.customer_stage import run_customer_stage
from .stages.identity_stage import run_identity_stage
from .stages.conversation_stage import run_conversation_stage
from .stages.business_brain_stage import run_business_brain_stage
from .stages.customer_brain_stage import run_customer_brain_stage
from .stages.intent_stage import run_intent_stage
from .stages.decision_stage import run_decision_stage
from .stages.reply_stage import run_reply_stage
from .stages.lead_stage import run_lead_stage
from ..memory import build_context


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
        context.add_log(
            f"Pipeline Timings: {context.timings}"
    )
        return context

    customer_timer = context.start_timer("Customer Stage")

    customer_result = run_customer_stage(
       organization_id=context.organization_id,
       channel=context.channel,
       sender_id=context.sender_id,
    )

    context.end_timer("Customer Stage", customer_timer)
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

    conversation_result = run_conversation_stage(sender_id=context.sender_id)
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

    intent_result = run_intent_stage(message_text=context.message_text)
    context.intent = intent_result.get("intent") or {}
    context.remember(
    "intent",
    intent_result.get("intent_name"),
    )

    context.remember(
       "intent_confidence",
       intent_result.get("intent_confidence"),
    )
    context.add_log(
        f"Intent Stage completed. Intent: {intent_result.get('intent_name')}"
    )

    lead_result = run_lead_stage(
    customer=context.customer,
    message_text=context.message_text,
    reply={},
    )

    context.lead = lead_result
    
    context.remember(
    "is_lead",
    lead_result.get("is_lead"),
    )

    context.remember(
       "lead_score",
       lead_result.get("lead_score"),
    )

    context.remember(
        "lead_temperature",
        lead_result.get("temperature"),
    )

    context.add_log(
        f"Lead Stage completed. Is Lead: {lead_result.get('is_lead')}"
    )

    decision_result = run_decision_stage(
    intent_result=context.intent
    )

    decision_result = run_decision_stage(intent_result=context.intent)

    context.decision = decision_result

    context.remember(
        "decision",
        decision_result.get("action"),
    )

    context.reply = {
        "decision": decision_result,
        "action": decision_result.get("action"),
        "should_reply": decision_result.get("should_reply"),
        "needs_human": decision_result.get("needs_human"),
        "reason": decision_result.get("reason"),
        "generated_reply": {},
        "reply_text": "",
        "category": "general",
    }

    context.add_log(
        f"Decision Stage completed. Action: {decision_result.get('action')}"
    )

    if decision_result.get("action") == "reply":
        reply_context = build_context(context.conversation)

        if context.business_context:
            reply_context = (
                reply_context
                + "\n\nActive Business Context:\n"
                + context.business_context
            )

        reply_result = run_reply_stage(
            message_text=context.message_text,
            channel=context.channel,
            context=reply_context,
        )

        context.reply["generated_reply"] = reply_result.get("reply") or {}
        context.reply["reply_text"] = reply_result.get("reply_text", "")
        context.reply["category"] = reply_result.get("category", "general")
        context.reply["should_reply"] = reply_result.get("should_reply", True)

        context.add_log("Reply Stage completed")

        context.remember(
        "reply_generated",
        True,
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