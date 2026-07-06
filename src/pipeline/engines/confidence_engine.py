"""
Confidence Engine

Decides whether the AI is confident enough to continue,
or whether the conversation should move to Human Review.
"""


SAFE_LOW_CONFIDENCE_INTENTS = {
    "greeting",
    "thanks",
    "acknowledgement",
    "closing",
    "general",
}


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

    if intent in SAFE_LOW_CONFIDENCE_INTENTS:
        return {
            "should_continue": True,
            "needs_human": False,
            "reason": "Safe low-risk intent",
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