"""
Decision Engine

Decides the next action for the pipeline.

Possible actions:
- reply
- human
- silent
"""


def make_decision(
    intent_result: dict,
    confidence_result: dict,
) -> dict:
    intent = intent_result.get("intent", "general")

    if confidence_result.get("needs_human"):
        return {
            "action": "human",
            "should_reply": False,
            "needs_human": True,
            "reason": confidence_result.get("reason", "Needs human review"),
        }

    if intent == "empty":
        return {
            "action": "silent",
            "should_reply": False,
            "needs_human": False,
            "reason": "Empty message",
        }

    return {
        "action": "reply",
        "should_reply": True,
        "needs_human": False,
        "reason": "Safe to generate reply",
    }