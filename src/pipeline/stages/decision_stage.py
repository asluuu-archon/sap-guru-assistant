"""
Decision Stage

Uses Confidence Engine and Decision Engine to decide
whether the pipeline should reply, stay silent, or move to human review.
"""

from ..engines.confidence_engine import evaluate_confidence
from ..engines.decision_engine import make_decision


def run_decision_stage(intent_result: dict) -> dict:
    confidence_result = evaluate_confidence(intent_result)

    decision_result = make_decision(
        intent_result=intent_result,
        confidence_result=confidence_result,
    )

    return {
        "confidence": confidence_result,
        "decision": decision_result,
        "action": decision_result.get("action", "human"),
        "should_reply": decision_result.get("should_reply", False),
        "needs_human": decision_result.get("needs_human", True),
        "reason": decision_result.get("reason", "No reason provided"),
    }