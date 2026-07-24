"""
Identity Engine — Phase 2

Fetches and stores real customer identity from each channel.

Priority order for name resolution:
1. WhatsApp contact profile name (from webhook payload)
2. Instagram display name (from Graph API — fetched async after first message)
3. Instagram username (from Graph API)
4. Stored customer name in DB
5. Friendly fallback: "User ...XXXX" (last 4 digits of sender_id)

Design principles:
- Never overwrite a good name with a blank
- Fetch from API only once per customer (cache in DB)
- All API fetches are non-blocking (fire-and-forget via background thread)
- Works for Instagram, WhatsApp, and future channels
"""

import os
import threading
from datetime import datetime
from ..memory import supabase


# ─── WEBHOOK IDENTITY EXTRACTION ─────────────────────────────────────────────

def build_basic_identity(
    channel: str,
    channel_user_id: str,
    raw_payload: dict | None = None,
) -> dict:
    """
    Extract identity from the webhook payload (synchronous, no API calls).
    For Instagram DMs, the payload rarely contains a name.
    For WhatsApp, the contacts array often contains the profile name.
    """
    username = ""
    display_name = ""
    avatar_url = ""

    if raw_payload:
        # Instagram / Facebook Messenger common fields
        username = (
            raw_payload.get("username")
            or raw_payload.get("user_id")
            or ""
        )
        display_name = (
            raw_payload.get("name")
            or raw_payload.get("display_name")
            or ""
        )

        # WhatsApp: contacts[0].profile.name
        contacts = raw_payload.get("contacts") or []
        if contacts:
            wa_name = contacts[0].get("profile", {}).get("name") or ""
            if wa_name:
                display_name = wa_name

        # WhatsApp: entry[].changes[].value.contacts
        entry_contacts = (
            raw_payload.get("entry", [{}])[0]
            .get("changes", [{}])[0]
            .get("value", {})
            .get("contacts", [])
        )
        if entry_contacts:
            wa_name = entry_contacts[0].get("profile", {}).get("name") or ""
            if wa_name:
                display_name = wa_name

    return {
        "channel": channel or "instagram",
        "channel_user_id": channel_user_id,
        "username": username,
        "display_name": display_name,
        "avatar_url": avatar_url,
        "identity_source": "webhook_enriched",
        "identity_payload": raw_payload or {},
    }


# ─── INSTAGRAM GRAPH API PROFILE FETCH ───────────────────────────────────────

def _get_best_instagram_token(business_id: str = None) -> str:
    """
    Get the best available Instagram token.
    Priority: per-business token from Supabase > INSTAGRAM_ACCESS_TOKEN env var.
    This ensures the correct per-business token is always used, not a stale env var.
    """
    # Try per-business token from Supabase first
    if business_id:
        try:
            res = supabase.table("business_integrations") \
                .select("credentials") \
                .eq("business_id", business_id) \
                .eq("provider", "instagram") \
                .eq("is_connected", True) \
                .order("updated_at", desc=True) \
                .limit(1).execute()
            if res.data:
                creds = res.data[0].get("credentials") or {}
                t = creds.get("page_access_token") or creds.get("access_token")
                if t:
                    return t
        except Exception as e:
            print(f"IDENTITY_ENGINE: Token lookup error (business={business_id}): {e}", flush=True)
    # Fallback: try any connected Instagram account
    try:
        res = supabase.table("business_integrations") \
            .select("credentials") \
            .eq("provider", "instagram") \
            .eq("is_connected", True) \
            .order("updated_at", desc=True) \
            .limit(1).execute()
        if res.data:
            creds = res.data[0].get("credentials") or {}
            t = creds.get("page_access_token") or creds.get("access_token")
            if t:
                return t
    except Exception as e:
        print(f"IDENTITY_ENGINE: Token fallback lookup error: {e}", flush=True)
    # Last resort: env var
    env_token = os.getenv("INSTAGRAM_ACCESS_TOKEN") or os.getenv("PAGE_ACCESS_TOKEN") or ""
    if env_token:
        print(f"IDENTITY_ENGINE: Using env var token as last resort (business={business_id})", flush=True)
    return env_token


def _fetch_instagram_profile(sender_id: str, business_id: str = None) -> dict:
    """
    Fetch Instagram user profile from Graph API.
    Returns dict with instagram_username, name, profile_pic.
    Returns empty dict on failure.
    """
    try:
        import requests
        token = _get_best_instagram_token(business_id)
        if not token or not sender_id:
            return {}

        response = requests.get(
            f"https://graph.facebook.com/v23.0/{sender_id}",
            params={
                "fields": "id,username,name",
                "access_token": token,
            },
            timeout=10,
        )

        if response.status_code == 200:
            data = response.json()
            return {
                "instagram_username": data.get("username", ""),
                "name": data.get("name", ""),
                "profile_pic": data.get("profile_pic", ""),
            }
        else:
            print(f"IDENTITY_ENGINE: Instagram profile fetch failed for {sender_id}: {response.status_code} {response.text[:200]}", flush=True)
            return {}

    except Exception as e:
        print(f"IDENTITY_ENGINE: Instagram profile fetch error for {sender_id}: {e}", flush=True)
        return {}


def _enrich_customer_from_instagram(customer_id: int, sender_id: str, business_id: str = None) -> None:
    """
    Background task: fetch Instagram profile and update customer record.
    Only runs if customer doesn't already have a real name.
    """
    try:
        # Check if customer already has a real name
        result = supabase.table("customers").select("name, username, display_name").eq("id", customer_id).execute()
        if not result.data:
            return

        customer = result.data[0]
        existing_name = customer.get("name") or customer.get("display_name") or ""

        # Skip if we already have a real name (not a numeric ID)
        if existing_name and not _is_numeric_id(existing_name):
            print(f"IDENTITY_ENGINE: Customer {customer_id} already has name '{existing_name}', skipping fetch", flush=True)
            return

        # Fetch from Instagram Graph API
        profile = _fetch_instagram_profile(sender_id, business_id=business_id)
        if not profile:
            return

        ig_name = profile.get("name") or profile.get("instagram_username") or ""
        ig_username = profile.get("instagram_username") or ""

        if not ig_name and not ig_username:
            return

        # Build update payload — never overwrite with blank
        payload = {
            "updated_at": datetime.utcnow().isoformat(),
            "identity_source": "instagram_graph_api",
        }
        if ig_username:
            payload["username"] = ig_username
        if ig_name:
            payload["name"] = ig_name
            payload["display_name"] = ig_name
        elif ig_username:
            payload["name"] = ig_username
            payload["display_name"] = ig_username

        supabase.table("customers").update(payload).eq("id", customer_id).execute()

        # Also update leads table if this sender_id has a lead
        if ig_name or ig_username:
            lead_name = ig_name or ig_username
            supabase.table("leads").update({
                "customer_name": lead_name,
                "instagram_username": ig_username,
                "updated_at": datetime.utcnow().isoformat(),
            }).eq("sender_id", sender_id).eq("customer_name", None).execute()

        print(f"IDENTITY_ENGINE: Enriched customer {customer_id} with name='{ig_name}' username='{ig_username}'", flush=True)

    except Exception as e:
        print(f"IDENTITY_ENGINE: Background enrichment error for customer {customer_id}: {e}", flush=True)


def _is_numeric_id(value: str) -> bool:
    """Return True if value looks like a raw numeric sender ID (10+ digits)."""
    return bool(value) and str(value).strip().isdigit() and len(str(value).strip()) >= 10


# ─── MAIN IDENTITY STAGE FUNCTIONS ───────────────────────────────────────────

def update_customer_identity(
    customer_id: int,
    identity: dict,
) -> None:
    """
    Update customer identity fields without overwriting good values with blanks.
    Called synchronously during the pipeline.
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


def trigger_background_identity_enrichment(
    customer_id: int,
    channel: str,
    sender_id: str,
    business_id: str = None,
) -> None:
    """
    Fire-and-forget background identity enrichment.
    For Instagram: fetches name/username from Graph API.
    For WhatsApp: name is already in the webhook payload (handled in build_basic_identity).
    Does not block the main pipeline.
    """
    if not customer_id or not sender_id:
        return

    if channel == "instagram":
        thread = threading.Thread(
            target=_enrich_customer_from_instagram,
            args=(customer_id, sender_id, business_id),
            daemon=True,
        )
        thread.start()
        print(f"IDENTITY_ENGINE: Background enrichment started for customer {customer_id} ({channel})", flush=True)


def get_display_name_for_sender(sender_id: str) -> str:
    """
    Get the best available display name for a sender_id.
    Used by API endpoints that need to show a name.
    Falls back to 'User ...XXXX' if no name found.
    """
    try:
        result = supabase.table("customers").select("name, display_name, username").eq("channel_user_id", sender_id).execute()
        if result.data:
            c = result.data[0]
            name = c.get("name") or c.get("display_name") or c.get("username") or ""
            if name and not _is_numeric_id(name):
                return name
    except Exception:
        pass

    # Friendly fallback
    sid = str(sender_id)
    return f"User ...{sid[-4:]}" if len(sid) >= 4 else sid
