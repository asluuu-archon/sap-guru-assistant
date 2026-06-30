from ...memory import get_conversation


def run_conversation_stage(sender_id: str) -> dict:
    """
    Conversation Stage

    Purpose:
    Load previous conversation memory for this sender.

    This stage does not generate replies.
    It only prepares conversation context for later stages.
    """

    conversation = get_conversation(sender_id)

    history = conversation.get("history") or []

    return {
        "conversation": conversation,
        "history_count": len(history),
        "is_returning_conversation": len(history) > 0,
    }