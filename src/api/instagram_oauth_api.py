"""
Instagram OAuth API — Production-Grade Multi-Tenant Connection Flow

Flow:
1. Client clicks "Connect Instagram" in the app
2. Frontend calls GET /instagram-oauth/start?business_id=<id>
3. Backend builds Meta OAuth URL and redirects client to Meta login
4. Client logs in on Meta, grants permissions
5. Meta redirects to GET /instagram-oauth/callback?code=...&state=...
6. Backend exchanges code for short-lived token, then extends to long-lived token
7. Backend fetches the Instagram Business Account ID linked to the page
8. Backend saves page_access_token + instagram_account_id into business_integrations
9. Frontend detects success and shows "Connected" status

Required environment variables (set in Render):
  META_APP_ID       — Your Meta App ID (from Meta Developer Portal → App Settings → Basic)
  META_APP_SECRET   — Your Meta App Secret (same location)

Required Meta App permissions (submit for App Review):
  instagram_basic
  instagram_manage_messages
  pages_messaging
  pages_show_list
  pages_read_engagement
"""

import os
import hashlib
import hmac
import json
import secrets
import requests
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse, HTMLResponse
from typing import Optional

router = APIRouter(prefix="/instagram-oauth", tags=["Instagram OAuth"])

# ─── Config ──────────────────────────────────────────────────────────────────

def _get_app_id():
    v = os.getenv("META_APP_ID", "")
    if not v:
        raise HTTPException(status_code=500, detail="META_APP_ID environment variable not set. Add it in Render → Environment.")
    return v

def _get_app_secret():
    v = os.getenv("META_APP_SECRET", "")
    if not v:
        raise HTTPException(status_code=500, detail="META_APP_SECRET environment variable not set. Add it in Render → Environment.")
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
    Generate the Meta OAuth URL and redirect the user to Meta login.
    The business_id is encoded in the state parameter so we know who to save the token for.
    """
    app_id = _get_app_id()
    base_url = _get_base_url()

    # Generate a secure random state token to prevent CSRF
    state_token = secrets.token_urlsafe(32)
    _oauth_state_store[state_token] = {
        "business_id": business_id,
        "redirect_after": redirect_after or f"{_get_frontend_url()}/#/integrations",
        "created_at": datetime.utcnow().isoformat(),
    }

    callback_url = f"{base_url}/instagram-oauth/callback"

    # Permissions required for Instagram DM automation
    scope = ",".join([
        "instagram_basic",
        "instagram_manage_messages",
        "pages_messaging",
        "pages_show_list",
        "pages_read_engagement",
        "business_management",
    ])

    oauth_url = (
        f"https://www.facebook.com/dialog/oauth"
        f"?client_id={app_id}"
        f"&redirect_uri={callback_url}"
        f"&scope={scope}"
        f"&state={state_token}"
        f"&response_type=code"
    )

    print(f"INSTAGRAM_OAUTH: Starting OAuth for business_id={business_id}, state={state_token[:8]}...", flush=True)
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
    Meta redirects here after the user grants (or denies) permissions.
    Exchange the code for a token, fetch account info, and save to Supabase.
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

    app_id = _get_app_id()
    app_secret = _get_app_secret()
    base_url = _get_base_url()
    callback_url = f"{base_url}/instagram-oauth/callback"

    try:
        # ── Step A: Exchange code for short-lived user access token ───────────
        token_res = requests.get(
            "https://graph.facebook.com/v23.0/oauth/access_token",
            params={
                "client_id": app_id,
                "client_secret": app_secret,
                "redirect_uri": callback_url,
                "code": code,
            },
            timeout=15,
        )
        token_data = token_res.json()

        if "error" in token_data:
            raise Exception(f"Token exchange failed: {token_data['error'].get('message', str(token_data))}")

        short_lived_token = token_data.get("access_token")
        if not short_lived_token:
            raise Exception("No access_token in token exchange response")

        print(f"INSTAGRAM_OAUTH: Short-lived token obtained for business_id={business_id}", flush=True)

        # ── Step B: Exchange for long-lived token (60-day) ────────────────────
        long_token_res = requests.get(
            "https://graph.facebook.com/v23.0/oauth/access_token",
            params={
                "grant_type": "fb_exchange_token",
                "client_id": app_id,
                "client_secret": app_secret,
                "fb_exchange_token": short_lived_token,
            },
            timeout=15,
        )
        long_token_data = long_token_res.json()
        long_lived_token = long_token_data.get("access_token", short_lived_token)

        print(f"INSTAGRAM_OAUTH: Long-lived token obtained for business_id={business_id}", flush=True)

        # ── Step C: Get the list of Pages the user manages ────────────────────
        pages_res = requests.get(
            "https://graph.facebook.com/v23.0/me/accounts",
            params={
                "access_token": long_lived_token,
                "fields": "id,name,access_token,instagram_business_account",
            },
            timeout=15,
        )
        pages_data = pages_res.json()

        if "error" in pages_data:
            raise Exception(f"Pages fetch failed: {pages_data['error'].get('message', str(pages_data))}")

        pages = pages_data.get("data", [])
        if not pages:
            return HTMLResponse(content=_error_page(
                "No Facebook Pages found",
                "No Facebook Pages were found on this account. Make sure you are logged in with the account that manages your business Facebook Page, and that the Page is connected to an Instagram Business account."
            ))

        # ── Step D: Find the page with an Instagram Business Account ──────────
        ig_page = None
        ig_account_id = None
        page_access_token = None
        page_name = None

        for page in pages:
            ig_biz = page.get("instagram_business_account")
            if ig_biz:
                ig_page = page
                ig_account_id = ig_biz.get("id")
                page_access_token = page.get("access_token")
                page_name = page.get("name")
                break

        if not ig_page or not ig_account_id:
            # No Instagram Business Account found — list all pages for debugging
            page_names = [p.get("name", "Unknown") for p in pages]
            return HTMLResponse(content=_error_page(
                "No Instagram Business Account found",
                f"Your Facebook Pages ({', '.join(page_names)}) don't have an Instagram Business Account connected. "
                f"Please go to Instagram Settings → Switch to Professional Account, then connect it to your Facebook Page in Meta Business Suite."
            ))

        # ── Step E: Get Instagram username for confirmation ───────────────────
        ig_info_res = requests.get(
            f"https://graph.facebook.com/v23.0/{ig_account_id}",
            params={
                "fields": "id,username,name",
                "access_token": page_access_token,
            },
            timeout=15,
        )
        ig_info = ig_info_res.json()
        ig_username = ig_info.get("username", "")
        ig_name = ig_info.get("name", "")

        print(f"INSTAGRAM_OAUTH: Found Instagram account @{ig_username} (ID: {ig_account_id}) for business_id={business_id}", flush=True)

        # ── Step F: Save to Supabase business_integrations ────────────────────
        supabase = _supabase()
        credentials = {
            "page_access_token": page_access_token,
            "instagram_account_id": ig_account_id,
            "instagram_username": ig_username,
            "instagram_name": ig_name,
            "page_id": ig_page.get("id"),
            "page_name": page_name,
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

        # ── Step G: Redirect back to frontend with success ────────────────────
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
    p {{ color: #94a3b8; margin: 8px 0; line-height: 1.6; }}
    a {{ color: #60a5fa; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">❌</div>
    <h2>{title}</h2>
    <p>{message}</p>
    <p><a href="javascript:history.back()">← Go back and try again</a></p>
  </div>
</body>
</html>
"""
