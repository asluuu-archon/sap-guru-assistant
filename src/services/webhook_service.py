"""
Webhook Service

This service will gradually take over webhook processing from app.py.

For now it only validates and identifies webhook type.
"""


async def process_instagram_webhook(data: dict) -> dict:
    print("========== WEBHOOK SERVICE ==========", flush=True)
    print(data, flush=True)

    entry = data.get("entry", [{}])[0]

    if "messaging" not in entry:
        print("Ignoring non-DM webhook", flush=True)
        return {"status": "ignored_non_dm"}

    messaging = entry["messaging"][0]

    if "message" not in messaging:
        print("Ignoring non-message event", flush=True)
        return {"status": "ignored_non_message"}

    return {
        "status": "message_received",
        "messaging": messaging,
    }