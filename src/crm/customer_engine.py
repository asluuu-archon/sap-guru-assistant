from datetime import datetime

from ..memory import supabase
from ..services.instagram_profile import get_instagram_profile


def should_enrich_instagram_profile(customer: dict, primary_channel: str) -> bool:
    if primary_channel != "instagram":
        return False

    if not customer:
        return False

    has_name = bool((customer.get("name") or "").strip())
    attributes = customer.get("attributes") or {}
    has_username = bool((attributes.get("instagram_username") or "").strip())

    return not has_name or not has_username


def enrich_customer_with_instagram_profile(customer: dict, channel_user_id: str) -> dict:
    profile = get_instagram_profile(channel_user_id)

    if not profile:
        return customer

    attributes = customer.get("attributes") or {}

    if profile.get("instagram_username"):
        attributes["instagram_username"] = profile.get("instagram_username")

    if profile.get("profile_pic"):
        attributes["profile_pic"] = profile.get("profile_pic")

    update_payload = {
        "name": profile.get("name") or customer.get("name") or "",
        "attributes": attributes,
        "updated_at": datetime.utcnow().isoformat(),
    }

    supabase.table("customers").update(update_payload).eq("id", customer["id"]).execute()

    customer.update(update_payload)

    print(
        f"INSTAGRAM PROFILE SAVED: {customer.get('name')} @{attributes.get('instagram_username')}",
        flush=True,
    )

    return customer


def get_customer_by_id(customer_id: str) -> dict:
    """Fetch a customer by their primary UUID."""
    try:
        res = supabase.table("customers").select("*").eq("id", customer_id).limit(1).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Error fetching customer by ID: {e}")
        return None


def get_or_create_customer(
    channel_user_id: str,
    primary_channel: str = "instagram",
    organization_id: int = 1,
) -> dict:
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

    # Cross-channel merging: if not found by ID, try by phone/email from recent lead info
    if not existing.data:
        lead_res = supabase.table("leads").select("phone, email, name").eq("sender_id", channel_user_id).order("id", desc=True).limit(1).execute()
        if lead_res.data:
            phone = lead_res.data[0].get("phone")
            email = lead_res.data[0].get("email")
            lead_name = lead_res.data[0].get("name")
            
            if phone or email:
                # 1. Search by phone/email to find if this person exists on another channel
                q = supabase.table("customers").select("*").eq("organization_id", organization_id)
                if phone: 
                    q = q.eq("phone", phone)
                elif email: 
                    q = q.eq("email", email)
                
                merged = q.limit(1).execute()
                
                if merged.data:
                    # Found existing person, link this new channel ID to their profile
                    customer = merged.data[0]
                    
                    # Update profile with new channel info if not already set
                    update_payload = {"updated_at": now}
                    if not customer.get("name") and lead_name:
                        update_payload["name"] = lead_name
                    
                    # Store the new channel ID in attributes if it's different
                    attributes = customer.get("attributes") or {}
                    if primary_channel == "instagram":
                        attributes["instagram_id"] = channel_user_id
                    elif primary_channel == "whatsapp":
                        attributes["whatsapp_id"] = channel_user_id
                    update_payload["attributes"] = attributes
                    
                    supabase.table("customers").update(update_payload).eq("id", customer["id"]).execute()
                    return customer

    if existing.data:
        customer = existing.data[0]

        supabase.table("customers").update({
            "updated_at": now,
        }).eq("id", customer["id"]).execute()

        if should_enrich_instagram_profile(customer, primary_channel):
            customer = enrich_customer_with_instagram_profile(
                customer=customer,
                channel_user_id=channel_user_id,
            )

        return customer

    profile = {}
    if primary_channel == "instagram":
        profile = get_instagram_profile(channel_user_id)

    attributes = {}

    if profile.get("instagram_username"):
        attributes["instagram_username"] = profile.get("instagram_username")

    if profile.get("profile_pic"):
        attributes["profile_pic"] = profile.get("profile_pic")

    payload = {
        "organization_id": organization_id,
        "primary_channel": primary_channel,
        "channel_user_id": channel_user_id,
        "name": profile.get("name") or "",
        "phone": "",
        "email": "",
        "location": "",
        "attributes": attributes,
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