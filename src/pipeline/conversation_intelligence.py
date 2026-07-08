"""
Conversation Intelligence

Determines WHAT the AI is trying to accomplish.

This is different from Intent.

Intent classifies the current message.

Conversation Intelligence classifies the overall conversation.
"""


def detect_conversation_goal(
    conversation: dict,
    latest_message: str,
) -> dict:

    latest = (latest_message or "").lower()

    last_question = (
        conversation.get("last_question") or ""
    ).lower()

    summary = (
        conversation.get("summary") or ""
    ).lower()

    state = (
        conversation.get("conversation_state") or "new"
    )

    # -------------------------
    # Greeting
    # -------------------------

    if state == "new":
        return {
            "goal": "greeting",
            "confidence": 1.0,
        }

    # -------------------------
    # Waiting for Phone
    # -------------------------

    if "phone" in last_question:
        return {
            "goal": "collect_phone",
            "confidence": 0.95,
        }

    # -------------------------
    # Waiting for Email
    # -------------------------

    if "email" in last_question:
        return {
            "goal": "collect_email",
            "confidence": 0.95,
        }

    # -------------------------
    # Waiting for Location
    # -------------------------

    if "location" in last_question:
        return {
            "goal": "collect_location",
            "confidence": 0.95,
        }

    # -------------------------
    # Waiting for Module
    # -------------------------

    if "module" in last_question:
        return {
            "goal": "collect_module",
            "confidence": 0.95,
        }

    # -------------------------
    # Appointment Flow
    # -------------------------

    if (
        "meeting" in summary
        or "appointment" in summary
        or "call" in summary
    ):
        return {
            "goal": "appointment",
            "confidence": 0.90,
        }

    # -------------------------
    # Lead Collection
    # -------------------------

    if state == "lead_collection":
        return {
            "goal": "lead_collection",
            "confidence": 0.90,
        }

    return {
        "goal": "general",
        "confidence": 0.50,
    }