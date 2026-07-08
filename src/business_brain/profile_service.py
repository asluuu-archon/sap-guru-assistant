from datetime import datetime

from ..memory import supabase


def get_business_profile(organization_id: int = 1):

    result = (
        supabase.table("business_profile")
        .select("*")
        .eq("organization_id", organization_id)
        .limit(1)
        .execute()
    )

    if result.data:
        return result.data[0]

    return None


def update_business_profile(
    organization_id: int,
    updates: dict,
):

    updates["updated_at"] = datetime.utcnow().isoformat()

    return (
        supabase.table("business_profile")
        .update(updates)
        .eq("organization_id", organization_id)
        .execute()
    )


def get_ai_persona(organization_id: int = 1):

    profile = get_business_profile(organization_id)

    if not profile:
        return ""

    return profile.get("ai_persona", "")


def get_reply_style(organization_id: int = 1):

    profile = get_business_profile(organization_id)

    if not profile:
        return {}

    return {
        "tone": profile.get("ai_tone"),
        "style": profile.get("reply_style"),
        "owner_mode": profile.get("should_speak_as_owner"),
        "owner_name": profile.get("owner_display_name"),
    }