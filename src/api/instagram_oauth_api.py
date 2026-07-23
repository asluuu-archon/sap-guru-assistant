"""
Instagram OAuth API — Production-Grade Multi-Tenant Connection Flow

Flow:
1. Client clicks "Connect Instagram" in the app
2. Frontend calls GET /instagram-oauth/start?business_id=<id>
3. Backend builds Instagram OAuth URL and redirects client to Instagram login
4. Client logs in on Instagram, grants permissions
5. Instagram redirects to GET /instagram-oauth/callback?code=...&state=...
6. Backend exchanges code for short-lived token, then extends to long-lived token
7. Backend fetches the Instagram account info
8. Backend saves access_token + instagram_account_id into business_integrations
9. Frontend detects success and shows "Connected" status

IMPORTANT — Two different App IDs exist for the same Meta app:
  META_APP_ID       — The Facebook/Meta App ID (shown at top of Meta App Dashboard)
                      Used for Facebook Login flows
  INSTAGRAM_APP_ID  — The Instagram App ID (shown in Instagram > API setup with Instagram login
                      > Business login settings > Instagram App ID)
                      This is the one used for instagram.com/oauth/authorize
                      From the embed URL in your dashboard: 994918496484799

Required environment variables (set in Render):
  META_APP_ID        — Facebook App ID (1993769641244156) — used for token exchange
  META_APP_SECRET    — Your Meta App Secret
  INSTAGRAM_APP_ID   — Instagram App ID (994918496484799) — used for OAuth authorize URL
  INSTAGRAM_APP_SECRET — Instagram App Secret (from Business login settings)

If INSTAGRAM_APP_ID is not set, falls back to META_APP_ID.
"""

import os
import json
import secrets
import requests
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from typing import Optional

router = APIRouter(prefix="/instagram-oauth", tags=["Instagram OAuth"])

# ─── Config ──────────────────────────────────────────────────────────────────

def _get_instagram_app_id():
    """
    The Instagram App ID — shown in:
    Meta App Dashboard → Instagram → API setup with Instagram login
    → Business login settings → Instagram App ID
    
    This is DIFFERENT from the Facebook App ID shown at the top of the dashboard.
    From the embed URL we saw: client_id=994918496484799
    """
    # Try INSTAGRAM_APP_ID first, fall back to META_APP_ID
    v = os.getenv("INSTAGRAM_APP_ID", "") or os.getenv("META_APP_ID", "")
    if not v:
        raise HTTPException(status_code=500, detail="INSTAGRAM_APP_ID environment variable not set. Add it in Render → Environment. Find it in Meta App Dashboard → Instagram → API setup with Instagram login → Business login settings → Instagram App ID")
    return v

def _get_instagram_app_secret():
    """
    The Instagram App Secret — shown in:
    Meta App Dashboard → Instagram → API setup with Instagram login
    → Business login settings → Instagram app secret
    
    This is DIFFERENT from the Facebook App Secret.
    """
    # Try INSTAGRAM_APP_SECRET first, fall back to META_APP_SECRET
    v = os.getenv("INSTAGRAM_APP_SECRET", "") or os.getenv("META_APP_SECRET", "")
    if not v:
        raise HTTPException(status_code=500, detail="INSTAGRAM_APP_SECRET environment variable not set. Add it in Render → Environment.")
    return v

def _get_base_url():
    return os.getenv("APP_BASE_URL", "https://sap-guru-assistant.onrender.com")

def _get_frontend_url():
    return os.getenv("FRONTEND_URL", "https://sap-guru-assistant.onrender.com")

def _supabase():
    from src.memory import supabase
    return supabase

# ─── State store (in-memory, survives single deploy) ─────────────────────────
# Maps state_token → business_id so the callback knows which business to save to
_oauth_state_store: dict = {}


# ─── Step 1: Start OAuth ─────────────────────────────────────────────────────

@router.get("/start")
async def start_instagram_oauth(
    business_id: str = Query(..., description="The business ID to connect Instagram for"),
    redirect_after: str = Query(None, description="Frontend URL to redirect to after success"),
):
    """
    Generate the Instagram OAuth URL and redirect the user to Instagram login.
    
    Uses instagram.com/oauth/authorize — the correct endpoint for Instagram API
    with Instagram Login (NOT facebook.com/dialog/oauth which is for Facebook Login).
    
    Uses the Instagram App ID (NOT the Facebook App ID) as client_id.
    """
    instagram_app_id = _get_instagram_app_id()
    base_url = _get_base_url()

    # Generate a secure random state token to prevent CSRF
    state_token = secrets.token_urlsafe(32)
    _oauth_state_store[state_token] = {
        "business_id": business_id,
        "redirect_after": redirect_after or f"{_get_frontend_url()}/#/integrations",
        "created_at": datetime.utcnow().isoformat(),
    }

    callback_url = f"{base_url}/instagram-oauth/callback"

    # Correct scopes for Instagram API with Instagram Login
    # Only instagram_business_basic is required; instagram_business_manage_messages
    # is needed for DM automation. Do NOT include instagram_business_manage_comments
    # unless you have it approved — it causes "Invalid Scopes" if not added in dashboard.
    scope = "instagram_business_basic,instagram_business_manage_messages"

    # CORRECT endpoint: instagram.com/oauth/authorize (NOT facebook.com/dialog/oauth)
    oauth_url = (
        f"https://www.instagram.com/oauth/authorize"
        f"?client_id={instagram_app_id}"
        f"&redirect_uri={callback_url}"
        f"&scope={scope}"
        f"&state={state_token}"
        f"&response_type=code"
        f"&enable_fb_login=0"
        f"&force_reauth=false"
    )

    print(f"INSTAGRAM_OAUTH: Starting OAuth for business_id={business_id}, state={state_token[:8]}...", flush=True)
    print(f"INSTAGRAM_OAUTH: Using Instagram App ID={instagram_app_id}", flush=True)
    print(f"INSTAGRAM_OAUTH: OAuth URL={oauth_url[:100]}...", flush=True)
    return RedirectResponse(url=oauth_url)


# ─── Step 2: OAuth Callback ───────────────────────────────────────────────────

@router.get("/callback")
async def instagram_oauth_callback(
    code: str = Query(None),
    state: str = Query(None),
    error: str = Query(None),
    error_description: str = Query(None),
):
    """
    Instagram redirects here after the user grants (or denies) permissions.
    Exchange the code for a token, fetch account info, and save to Supabase.
    
    Token exchange uses api.instagram.com/oauth/access_token (Instagram endpoint,
    NOT graph.facebook.com which is for Facebook Login).
    """
    # ── Handle user denial ────────────────────────────────────────────────────
    if error:
        print(f"INSTAGRAM_OAUTH: User denied permissions: {error} — {error_description}", flush=True)
        return HTMLResponse(content=_error_page(
            "Instagram connection cancelled",
            "You denied the permissions request. Please try again and click 'Allow' to connect Instagram."
        ))

    if not code or not state:
        return HTMLResponse(content=_error_page(
            "Invalid callback",
            "Missing code or state parameter. Please try connecting again."
        ))

    # ── Validate state ────────────────────────────────────────────────────────
    state_data = _oauth_state_store.pop(state, None)
    if not state_data:
        return HTMLResponse(content=_error_page(
            "Session expired",
            "The OAuth session has expired or is invalid. Please try connecting again."
        ))

    business_id = state_data["business_id"]
    redirect_after = state_data["redirect_after"]

    instagram_app_id = _get_instagram_app_id()
    instagram_app_secret = _get_instagram_app_secret()
    base_url = _get_base_url()
    callback_url = f"{base_url}/instagram-oauth/callback"

    try:
        # ── Step A: Exchange code for short-lived Instagram User access token ──
        # Correct endpoint: api.instagram.com/oauth/access_token
        # Uses Instagram App ID and Instagram App Secret (NOT Facebook App ID/Secret)
        token_res = requests.post(
            "https://api.instagram.com/oauth/access_token",
            data={
                "client_id": instagram_app_id,
                "client_secret": instagram_app_secret,
                "grant_type": "authorization_code",
                "redirect_uri": callback_url,
                "code": code,
            },
            timeout=15,
        )
        token_data = token_res.json()
        print(f"INSTAGRAM_OAUTH: Token exchange response: {json.dumps(token_data)[:200]}", flush=True)

        if "error_type" in token_data or ("error" in token_data and isinstance(token_data["error"], dict)):
            err_msg = token_data.get("error_message") or token_data.get("error", {}).get("message", str(token_data))
            raise Exception(f"Token exchange failed: {err_msg}")

        if "error" in token_data and isinstance(token_data["error"], str):
            raise Exception(f"Token exchange failed: {token_data.get('error_description', token_data['error'])}")

        short_lived_token = token_data.get("access_token")
        ig_user_id = str(token_data.get("user_id", ""))
        if not short_lived_token:
            raise Exception(f"No access_token in token exchange response: {token_data}")

        print(f"INSTAGRAM_OAUTH: Short-lived token obtained for business_id={business_id}, ig_user_id={ig_user_id}", flush=True)

        # ── Step B: Exchange for long-lived token (60-day) ────────────────────
        # Correct endpoint: graph.instagram.com/access_token
        long_token_res = requests.get(
            "https://graph.instagram.com/access_token",
            params={
                "grant_type": "ig_exchange_token",
                "client_secret": instagram_app_secret,
                "access_token": short_lived_token,
            },
            timeout=15,
        )
        long_token_data = long_token_res.json()
        print(f"INSTAGRAM_OAUTH: Long token response: {json.dumps(long_token_data)[:200]}", flush=True)

        if "error" in long_token_data:
            # Non-fatal: use short-lived token if long-lived exchange fails
            print(f"INSTAGRAM_OAUTH: Long-lived token exchange failed, using short-lived: {long_token_data}", flush=True)
            long_lived_token = short_lived_token
        else:
            long_lived_token = long_token_data.get("access_token", short_lived_token)

        print(f"INSTAGRAM_OAUTH: Token ready for business_id={business_id}", flush=True)

        # ── Step C: Get Instagram account info ────────────────────────────────
        # For Instagram API with Instagram Login, use graph.instagram.com
        ig_info_res = requests.get(
            "https://graph.instagram.com/v23.0/me",
            params={
                "fields": "id,username,name",
                "access_token": long_lived_token,
            },
            timeout=15,
        )
        ig_info = ig_info_res.json()
        print(f"INSTAGRAM_OAUTH: Account info response: {json.dumps(ig_info)[:200]}", flush=True)

        if "error" in ig_info:
            raise Exception(f"Instagram info fetch failed: {ig_info['error'].get('message', str(ig_info))}")

        ig_account_id = ig_info.get("id", ig_user_id)
        ig_username = ig_info.get("username", "")
        ig_name = ig_info.get("name", "")

        print(f"INSTAGRAM_OAUTH: Found Instagram account @{ig_username} (ID: {ig_account_id}) for business_id={business_id}", flush=True)

        # ── Step D: Save to Supabase business_integrations ────────────────────
        supabase = _supabase()
        credentials = {
            "page_access_token": long_lived_token,
            "instagram_account_id": ig_account_id,
            "instagram_username": ig_username,
            "instagram_name": ig_name,
            "connected_via": "oauth",
            "connected_at": datetime.utcnow().isoformat(),
        }

        existing = supabase.table("business_integrations") \
            .select("id") \
            .eq("business_id", business_id) \
            .eq("provider", "instagram") \
            .execute()

        payload = {
            "business_id": business_id,
            "provider": "instagram",
            "is_connected": True,
            "credentials": credentials,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if existing.data:
            supabase.table("business_integrations").update(payload).eq("id", existing.data[0]["id"]).execute()
        else:
            supabase.table("business_integrations").insert(payload).execute()

        print(f"INSTAGRAM_OAUTH: Saved credentials for business_id={business_id}, @{ig_username}", flush=True)

        # ── Step E: Redirect back to frontend with success ────────────────────
        return HTMLResponse(content=_success_page(ig_username, ig_name, redirect_after))

    except Exception as e:
        print(f"INSTAGRAM_OAUTH: Error during callback: {e}", flush=True)
        return HTMLResponse(content=_error_page(
            "Connection failed",
            f"An error occurred while connecting Instagram: {str(e)}. Please try again."
        ))


# ─── Status endpoint ──────────────────────────────────────────────────────────

@router.get("/status")
async def get_oauth_status(business_id: str = Query(...)):
    """Check if a business has a connected Instagram account via OAuth."""
    try:
        supabase = _supabase()
        res = supabase.table("business_integrations") \
            .select("is_connected, credentials, updated_at") \
            .eq("business_id", business_id) \
            .eq("provider", "instagram") \
            .execute()

        if not res.data or not res.data[0].get("is_connected"):
            return {"status": "not_connected"}

        creds = res.data[0].get("credentials") or {}
        return {
            "status": "connected",
            "instagram_username": creds.get("instagram_username", ""),
            "instagram_name": creds.get("instagram_name", ""),
            "instagram_account_id": creds.get("instagram_account_id", ""),
            "connected_via": creds.get("connected_via", "manual"),
            "connected_at": creds.get("connected_at", res.data[0].get("updated_at")),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Disconnect endpoint ──────────────────────────────────────────────────────

@router.post("/disconnect")
async def disconnect_instagram(business_id: str = Query(...)):
    """Disconnect Instagram for a business."""
    try:
        supabase = _supabase()
        supabase.table("business_integrations") \
            .update({"is_connected": False, "updated_at": datetime.utcnow().isoformat()}) \
            .eq("business_id", business_id) \
            .eq("provider", "instagram") \
            .execute()
        return {"status": "success", "message": "Instagram disconnected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── HTML response helpers ────────────────────────────────────────────────────

def _success_page(username: str, name: str, redirect_url: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <title>Instagram Connected</title>
  <meta charset="utf-8">
  <meta http-equiv="refresh" content="3;url={redirect_url}">
  <style>
    body {{ font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; background: #0f172a; color: white; }}
    .card {{ text-align: center; padding: 40px; background: #1e293b; border-radius: 16px;
             border: 1px solid #166534; max-width: 400px; }}
    .icon {{ font-size: 48px; margin-bottom: 16px; }}
    h2 {{ color: #4ade80; margin: 0 0 8px; }}
    p {{ color: #94a3b8; margin: 8px 0; }}
    .username {{ color: #e2e8f0; font-weight: 600; font-size: 18px; }}
    .redirect {{ color: #64748b; font-size: 13px; margin-top: 20px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">✅</div>
    <h2>Instagram Connected!</h2>
    <p class="username">@{username}</p>
    <p>{name}</p>
    <p>Your Instagram account is now connected to the AI Command Centre.</p>
    <p class="redirect">Redirecting you back to the dashboard...</p>
  </div>
  <script>setTimeout(() => window.location.href = '{redirect_url}', 3000);</script>
</body>
</html>
"""

def _error_page(title: str, message: str) -> str:
    return f"""
<!DOCTYPE html>
<html>
<head>
  <title>Connection Failed</title>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, sans-serif; display: flex; align-items: center; justify-content: center;
           min-height: 100vh; margin: 0; background: #0f172a; color: white; }}
    .card {{ text-align: center; padding: 40px; background: #1e293b; border-radius: 16px;
             border: 1px solid #7f1d1d; max-width: 400px; }}
    .icon {{ font-size: 48px; margin-bottom: 16px; }}
    h2 {{ color: #f87171; margin: 0 0 8px; }}
    p {{ color: #94a3b8; margin: 8px 0; }}
    .retry {{ margin-top: 20px; padding: 10px 20px; background: #1d4ed8; border: none;
              border-radius: 8px; color: white; cursor: pointer; font-size: 14px; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h2>{title}</h2>
    <p>{message}</p>
    <button class="retry" onclick="window.history.back()">Try Again</button>
  </div>
</body>
</html>
"""
