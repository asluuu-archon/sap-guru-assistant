from ..instagram import send_instagram_reply
from ..whatsapp import send_whatsapp_reply

def send_channel_reply(
    channel: str,
    recipient_id: str,
    message: str,
    access_token: str = None,
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
        result = send_instagram_reply(recipient_id, message.strip(), access_token=access_token)
        
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

    if clean_channel == "whatsapp":
        result = send_whatsapp_reply(recipient_id, message.strip())
        
        if result.get("error"):
            return {
                "status": "error",
                "message": result["error"],
                "channel": "whatsapp"
            }

        return {
            "status": "success",
            "channel": "whatsapp",
            "provider_result": result,
        }

    if clean_channel == "website_chat":
        # For website chat, we return the reply immediately in the HTTP response
        # rather than calling an external API.
        return {
            "status": "success",
            "channel": "website_chat",
            "message": message.strip()
        }

    return {
        "status": "error",
        "message": f"Unsupported channel: {clean_channel}",
    }