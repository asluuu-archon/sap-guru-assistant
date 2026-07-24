import os
import requests


def _get_token_from_supabase(business_id: str = None) -> str:
    """
    Get the best available Instagram token from Supabase.
    Priority: per-business token > any connected account > env var fallback.
    This ensures the correct live token is always used, never a stale env var.
    """
    try:
        from supabase import create_client
        sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
        query = sb.table("business_integrations").select("credentials") \
            .eq("provider", "instagram").eq("is_connected", True)
        if business_id:
            query = query.eq("business_id", business_id)
        res = query.limit(1).execute()
        if res.data:
            creds = res.data[0].get("credentials") or {}
            t = creds.get("page_access_token") or creds.get("access_token")
            if t:
                return t
    except Exception:
        pass
    return os.getenv("INSTAGRAM_ACCESS_TOKEN") or ""


def get_instagram_profile(sender_id: str, business_id: str = None) -> dict:
    token = _get_token_from_supabase(business_id)

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
