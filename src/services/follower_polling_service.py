"""
Follower Polling Service
========================
NOTE: The Instagram Graph API does NOT expose a /followers endpoint for Business accounts.
Follower detection is handled exclusively via Meta Webhooks (follow events sent to /webhook).

This module is kept as a stub so the import in app.py does not break.
The startup polling task in app.py is a no-op — it simply sleeps and does nothing.
"""

async def poll_new_followers():
    """
    Stub — follower detection is handled via Meta webhooks, not polling.
    The Instagram Graph API does not provide a /followers list endpoint for Business accounts.
    New follower events arrive as webhook payloads to POST /webhook with:
      entry[0].changes[].value.item == "follow" and .verb == "add"
    """
    print("POLLING: Follower polling is disabled — using webhook-based detection instead.", flush=True)
    return {"status": "disabled", "reason": "Instagram Graph API does not support /followers endpoint for Business accounts"}
