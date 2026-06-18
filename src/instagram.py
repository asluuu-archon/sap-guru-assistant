import os
import requests

ACCESS_TOKEN = os.getenv("INSTAGRAM_ACCESS_TOKEN")

def send_instagram_reply(recipient_id, message):

    url = "https://graph.instagram.com/v23.0/me/messages"

    payload = {
        "recipient": {"id": recipient_id},
        "message": {"text": message}
    }

    params = {
        "access_token": ACCESS_TOKEN
    }

    response = requests.post(
        url,
        params=params,
        json=payload
    )

    print("INSTAGRAM SEND:", response.status_code, flush=True)
    print(response.text, flush=True)

    return response