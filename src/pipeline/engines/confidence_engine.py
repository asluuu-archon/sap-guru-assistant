"""
Confidence Engine

Decides whether the AI is confident enough to continue,
or whether the conversation should move to Human Review.
"""


def evaluate_confidence(intent_result: dict) -> dict:
    intent = intent_result.get("intent", "general")
    confidence = float(intent_result.get("confidence", 0.0))

    if intent == "empty":
        return {
            "should_continue": False,
            "needs_human": True,
            "reason": "Empty message",
            "confidence": confidence,
        }

    if confidence < 0.5:
        return {
            "should_continue": False,
            "needs_human": True,
            "reason": "Low confidence intent",
            "confidence": confidence,
        }

    return {
        "should_continue": True,
        "needs_human": False,
        "reason": "Confidence acceptable",
        "confidence": confidence,
    }