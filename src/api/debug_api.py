"""
Pipeline Debugger API

Runs a test message through the full pipeline and returns
stage-by-stage results with timing for the dashboard debugger.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from ..pipeline.message_pipeline import build_message_context, run_pipeline

router = APIRouter()


class DebugRequest(BaseModel):
    message: str
    sender_id: str = "debug_test_user"
    organization_id: int = 1
    channel: str = "instagram"


@router.post("/debug/pipeline")
def debug_pipeline(req: DebugRequest):
    """
    Run a test message through the full AI pipeline and return
    stage-by-stage results with timing for the debugger UI.
    """
    try:
        context = build_message_context(
            organization_id=req.organization_id,
            channel=req.channel,
            sender_id=req.sender_id,
            message_text=req.message,
            raw_payload={},
        )

        context = run_pipeline(context)

        # Build stage-by-stage breakdown for the UI
        stages = []

        # 1. Customer Stage
        stages.append({
            "name": "Customer Stage",
            "icon": "user",
            "status": "completed",
            "timing_ms": context.timings.get("Customer Stage", 0),
            "summary": f"Customer ID: {context.customer_id or 'New'}",
            "details": {
                "customer_id": context.customer_id,
                "is_new": context.customer_id is None,
                "channel": context.channel,
            }
        })

        # 2. Identity Stage
        stages.append({
            "name": "Identity Stage",
            "icon": "id-card",
            "status": "completed",
            "timing_ms": context.timings.get("Identity Stage", 0),
            "summary": f"Name: {context.identity.get('name') or context.identity.get('username') or 'Unknown'}",
            "details": context.identity or {"note": "No identity data found"},
        })

        # 3. Conversation Stage
        conv = context.conversation or {}
        is_returning = bool(conv.get("history") or conv.get("summary"))
        stages.append({
            "name": "Conversation Stage",
            "icon": "message",
            "status": "completed",
            "timing_ms": context.timings.get("Conversation Stage", 0),
            "summary": f"{'Returning customer' if is_returning else 'New conversation'} · State: {conv.get('conversation_state', 'new')}",
            "details": {
                "conversation_state": conv.get("conversation_state", "new"),
                "is_returning": is_returning,
                "needs_human": conv.get("needs_human", False),
                "ai_replied": conv.get("ai_replied", False),
                "pending_reply": conv.get("pending_reply", False),
            }
        })

        # 4. Business Brain Stage
        has_biz_context = bool(context.business_context)
        stages.append({
            "name": "Business Brain Stage",
            "icon": "brain",
            "status": "completed",
            "timing_ms": context.timings.get("Business Brain Stage", 0),
            "summary": f"{'Rule matched — context injected' if has_biz_context else 'No matching business rule'}",
            "details": {
                "has_context": has_biz_context,
                "context_preview": (context.business_context[:200] + "...") if len(context.business_context) > 200 else context.business_context or "None",
            }
        })

        # 5. Customer Brain Stage
        stages.append({
            "name": "Customer Brain Stage",
            "icon": "sparkles",
            "status": "completed",
            "timing_ms": context.timings.get("Customer Brain Stage", 0),
            "summary": f"Facts found: {context.ai_memory.get('facts_found', 0) or 'N/A'}",
            "details": {
                "facts_found": context.ai_memory.get("facts_found", 0),
            }
        })

        # 6. Intent Stage
        intent = context.intent or {}
        intent_name = context.ai_memory.get("intent") or intent.get("intent") or "unknown"
        intent_conf = context.ai_memory.get("intent_confidence") or intent.get("confidence") or 0
        stages.append({
            "name": "Intent Stage",
            "icon": "target",
            "status": "completed",
            "timing_ms": context.timings.get("Intent Stage", 0),
            "summary": f"Intent: {intent_name} · Confidence: {round(float(intent_conf or 0) * 100)}%",
            "details": {
                "intent": intent_name,
                "confidence": intent_conf,
                "raw": intent,
            }
        })

        # 7. Lead Stage
        lead = context.lead or {}
        is_lead = lead.get("is_lead", False)
        lead_score = lead.get("lead_score", 0)
        temperature = lead.get("temperature", "cold")
        stages.append({
            "name": "Lead Stage",
            "icon": "flame",
            "status": "completed",
            "timing_ms": context.timings.get("Lead Stage", 0),
            "summary": f"{'Lead detected' if is_lead else 'Not a lead'} · Score: {lead_score} · Temperature: {temperature}",
            "details": {
                "is_lead": is_lead,
                "lead_score": lead_score,
                "temperature": temperature,
                "interested_module": lead.get("interested_module"),
                "location": lead.get("location"),
                "mode": lead.get("mode"),
            }
        })

        # 8. Decision Stage
        decision = context.decision or {}
        action = decision.get("action", "unknown")
        should_reply = decision.get("should_reply", False)
        needs_human = decision.get("needs_human", False)
        stages.append({
            "name": "Decision Stage",
            "icon": "split",
            "status": "completed",
            "timing_ms": context.timings.get("Decision Stage", 0),
            "summary": f"Action: {action} · Should Reply: {should_reply} · Needs Human: {needs_human}",
            "details": {
                "action": action,
                "should_reply": should_reply,
                "needs_human": needs_human,
                "reason": decision.get("reason", ""),
            }
        })

        # 9. Reply Stage (only if action == reply)
        reply = context.reply or {}
        reply_text = reply.get("reply_text", "")
        if action == "reply" and reply_text:
            stages.append({
                "name": "Reply Stage",
                "icon": "send",
                "status": "completed",
                "timing_ms": context.timings.get("Reply Stage", 0),
                "summary": f"Reply generated ({len(reply_text)} chars) · Category: {reply.get('category', 'general')}",
                "details": {
                    "reply_text": reply_text,
                    "category": reply.get("category", "general"),
                    "should_reply": reply.get("should_reply", True),
                }
            })
        else:
            stages.append({
                "name": "Reply Stage",
                "icon": "send",
                "status": "skipped",
                "timing_ms": 0,
                "summary": f"Skipped — action is '{action}', no reply generated",
                "details": {"reason": f"Decision action was '{action}', reply stage not triggered"}
            })

        # Total timing
        total_ms = sum(context.timings.values())

        return {
            "status": "success",
            "message": req.message,
            "sender_id": req.sender_id,
            "stages": stages,
            "total_ms": round(total_ms, 2),
            "reply_text": reply_text,
            "reply_category": reply.get("category", "general"),
            "is_lead": is_lead,
            "intent": intent_name,
            "action": action,
            "needs_human": needs_human,
            "logs": context.logs,
            "ai_memory": context.ai_memory,
        }

    except Exception as e:
        import traceback
        return {
            "status": "error",
            "message": str(e),
            "traceback": traceback.format_exc(),
            "stages": [],
        }
