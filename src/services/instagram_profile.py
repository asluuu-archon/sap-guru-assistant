import os
import requests


def get_instagram_profile(sender_id: str) -> dict:
    token = os.getenv("INSTAGRAM_ACCESS_TOKEN")

    if not token or not sender_id:
        return {}

    try:
        response = requests.get(
            f"https://graph.facebook.com/v23.0/{sender_id}",
            params={
                "fields": "id,username,name",
                "access_token": token,
            },
            timeout=15,
        )

        if response.status_code != 200:
            print(f"INSTAGRAM PROFILE ERROR: {response.text}", flush=True)
            return {}

        data = response.json()

        return {
            "instagram_username": data.get("username", ""),
            "name": data.get("name", ""),
            "profile_pic": data.get("profile_pic", ""),
        }

    except Exception as e:
        print(f"INSTAGRAM PROFILE FETCH ERROR: {e}", flush=True)
        return {}