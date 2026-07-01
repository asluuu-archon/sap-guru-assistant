"""
Reply Stage

Generates the AI reply after the pipeline has decided
that it is safe to respond.
"""

from ..engines.reply_engine import generate_reply


def run_reply_stage(
    message_text: str,
    channel: str,
    context: str,
) -> dict:

    reply = generate_reply(
        message_text=message_text,
        channel=channel,
        context=context,
    )

    return {
        "reply": reply,
        "reply_text": reply.get("suggested_reply", ""),
        "category": reply.get("category", "general"),
        "should_reply": reply.get("should_reply", True),
    }