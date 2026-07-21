import os
import requests

def send_instagram_reply(recipient_id, message, access_token: str = None):
    # Use per-business token if provided, else fall back to env
    token = access_token or os.getenv("META_PAGE_ACCESS_TOKEN") or os.getenv("INSTAGRAM_ACCESS_TOKEN")
    
    if not token:
        return {"error": "No access token configured"}

    url = "https://graph.instagram.com/v23.0/me/messages"

    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message}
    }

    params = {
        "access_token": token
    }

    try:
        response = requests.post(
            url,
            params=params,
            json=payload,
            timeout=10
        )

        print("INSTAGRAM SEND:", response.status_code, flush=True)
        print(response.text, flush=True)

        if response.status_code == 200:
            return {"success": True, "message_id": response.json().get("message_id")}
        else:
            return {"error": f"API Error {response.status_code}: {response.text}"}
            
    except Exception as e:
        print("INSTAGRAM SEND EXCEPTION:", str(e), flush=True)
        return {"error": str(e)}