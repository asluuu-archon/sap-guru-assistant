from datetime import datetime
from ..memory import supabase


def build_basic_identity(
    channel: str,
    channel_user_id: str,
    raw_payload: dict | None = None,
) -> dict:
    """
    Phase 1 Identity Engine.

    Today we only store safe available identity:
    - channel
    - channel_user_id
    - raw_payload

    Future:
    - Instagram username fetch
    - Facebook profile fetch
    - WhatsApp contact profile
    - Email sender identity
    """

    return {
        "channel": channel or "instagram",
        "channel_user_id": channel_user_id,
        "username": "",
        "display_name": "",
        "avatar_url": "",
        "identity_source": "webhook_basic",
        "identity_payload": raw_payload or {},
    }


def update_customer_identity(
    customer_id: int,
    identity: dict,
) -> None:
    """
    Update customer identity fields without overwriting good values with blanks.
    """

    if not customer_id:
        return

    now = datetime.utcnow().isoformat()

    payload = {
        "updated_at": now,
        "identity_source": identity.get("identity_source", "webhook_basic"),
        "identity_payload": identity.get("identity_payload", {}),
    }

    if identity.get("username"):
        payload["username"] = identity["username"]

    if identity.get("display_name"):
        payload["display_name"] = identity["display_name"]
        payload["name"] = identity["display_name"]

    if identity.get("avatar_url"):
        payload["avatar_url"] = identity["avatar_url"]

    supabase.table("customers").update(payload).eq("id", customer_id).execute()