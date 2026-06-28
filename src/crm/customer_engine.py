from datetime import datetime
from ..memory import supabase


def get_or_create_customer(
    channel_user_id: str,
    primary_channel: str = "instagram",
    organization_id: int = 1,
) -> dict:
    """
    Find existing customer by organization + channel + channel_user_id.
    If not found, create a new customer.

    This is Phase 1 of Customer Engine.
    """

    now = datetime.utcnow().isoformat()

    existing = (
        supabase.table("customers")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("primary_channel", primary_channel)
        .eq("channel_user_id", channel_user_id)
        .limit(1)
        .execute()
    )

    if existing.data:
        customer = existing.data[0]

        supabase.table("customers").update({
            "updated_at": now,
        }).eq("id", customer["id"]).execute()

        return customer

    payload = {
        "organization_id": organization_id,
        "primary_channel": primary_channel,
        "channel_user_id": channel_user_id,
        "name": "",
        "phone": "",
        "email": "",
        "location": "",
        "attributes": {},
        "lead_score": 0,
        "lead_temperature": "unknown",
        "status": "new",
        "created_at": now,
        "updated_at": now,
    }

    result = supabase.table("customers").insert(payload).execute()

    if result.data:
        return result.data[0]

    return payload