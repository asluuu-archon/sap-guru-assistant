from ...memory import get_conversation


def run_conversation_stage(
    sender_id: str,
) -> dict:
    """
    Loads previous conversation from memory.

    This stage does NOT generate replies.
    It only enriches the MessageContext.
    """

    conversation = get_conversation(sender_id)

    if not conversation:
        return {
            "conversation": {},
            "is_new_customer": True,
        }

    return {
        "conversation": conversation,
        "is_new_customer": False,
    }