from ..instagram import send_instagram_reply

def send_channel_reply(
    channel: str,
    recipient_id: str,
    message: str,
) -> dict:
    """
    Single place to send replies across channels.

    Today:
    - instagram

    Future:
    - whatsapp
    - facebook
    - email
    - website_chat
    """

    clean_channel = (channel or "instagram").lower().strip()

    if not recipient_id:
        return {
            "status": "error",
            "message": "recipient_id is required",
        }

    if not message or not message.strip():
        return {
            "status": "error",
            "message": "message is required",
        }

    if clean_channel == "instagram":
        result = send_instagram_reply(recipient_id, message.strip())
        
        if result.get("error"):
            return {
                "status": "error",
                "message": result["error"],
                "channel": "instagram"
            }

        return {
            "status": "success",
            "channel": "instagram",
            "provider_result": result,
        }

    return {
        "status": "error",
        "message": f"Unsupported channel: {clean_channel}",
    }