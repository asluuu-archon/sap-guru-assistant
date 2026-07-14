"""
Reply Engine

Generates AI reply using existing assistant logic.

This is v1, so it wraps the current suggest_reply() function.
Later this engine will become channel-agnostic and organization-aware.
"""

from ...assistant import suggest_reply


async def generate_reply(
    message_text: str,
    channel: str,
    context: str,
) -> dict:
    return await suggest_reply(
        message=message_text,
        channel=channel,
        context=context,
    )