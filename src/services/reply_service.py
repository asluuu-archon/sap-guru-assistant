"""
Reply Service

Central place for sending replies.

Later this service will handle:
- channel selection
- delivery logging
- retries
- failed delivery handling
- analytics
"""

from ..channels.sender import send_channel_reply


def send_reply(
    channel: str,
    recipient_id: str,
    message: str,
) -> dict:
    if not recipient_id:
        return {
            "status": "error",
            "message": "recipient_id is required",
        }

    if not message or not message.strip():
        return {
            "status": "error",
            "message": "reply message is empty",
        }

    result = send_channel_reply(
        channel=channel,
        recipient_id=recipient_id,
        message=message.strip(),
    )

    return {
        "status": "sent",
        "channel": channel,
        "recipient_id": recipient_id,
        "message": message.strip(),
        "result": result,
    }