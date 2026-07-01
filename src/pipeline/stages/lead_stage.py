"""
Lead Stage

Evaluates whether the current interaction is a possible sales lead.
"""

from ..engines.lead_engine import evaluate_lead


def run_lead_stage(
    customer: dict,
    message_text: str,
    reply: dict,
) -> dict:
    lead_result = evaluate_lead(
        customer=customer,
        message=message_text,
        reply=reply,
    )

    return {
        "lead": lead_result,
        "is_lead": lead_result.get("is_lead", False),
        "lead_score": lead_result.get("lead_score", 0),
        "temperature": lead_result.get("temperature", "cold"),
        "summary": lead_result.get("summary", ""),
        "next_action": lead_result.get("next_action", ""),
    }