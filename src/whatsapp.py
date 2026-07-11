import os
import requests

def send_whatsapp_reply(recipient_id, message):
    # Fetch token dynamically
    token = os.getenv("META_PAGE_ACCESS_TOKEN") or os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    
    if not token or not phone_number_id:
        return {"error": "WhatsApp token or phone number ID not configured"}

    url = f"https://graph.facebook.com/v23.0/{phone_number_id}/messages"

    payload = {
        "messaging_product": "whatsapp",
        "recipient_type": "individual",
        "to": recipient_id,
        "type": "text",
        "text": {"preview_url": False, "body": message}
    }

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=10
        )

        print("WHATSAPP SEND:", response.status_code, flush=True)
        print(response.text, flush=True)

        if response.status_code == 200:
            return {"success": True, "message_id": response.json().get("messages", [{}])[0].get("id")}
        else:
            return {"error": f"API Error {response.status_code}: {response.text}"}
            
    except Exception as e:
        print("WHATSAPP SEND EXCEPTION:", str(e), flush=True)
        return {"error": str(e)}
