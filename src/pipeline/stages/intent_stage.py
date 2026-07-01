"""
Intent Stage

Uses Intent Engine to detect what the customer wants.
"""

from ..engines.intent_engine import detect_intent


def run_intent_stage(message_text: str) -> dict:
    intent_result = detect_intent(message_text)

    return {
        "intent": intent_result,
        "intent_name": intent_result.get("intent", "general"),
        "intent_confidence": intent_result.get("confidence", 0.0),
    }