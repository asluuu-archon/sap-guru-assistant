"""
Integrations API — Self-Serve Channel Connection

Each business can connect their own:
- Instagram (Page Access Token + Page ID)
- WhatsApp (Business Token + Phone Number ID + Webhook Verify Token)
- OpenAI (API Key + Model preference)
- Facebook (Page Access Token + Page ID)
- Google My Business (API Key)
- Custom Webhook (URL + secret)

All tokens stored per-business in Supabase business_integrations table.
The AI pipeline reads tokens from here instead of environment variables.
"""

from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

router = APIRouter(prefix="/integrations", tags=["Integrations"])


def _supabase():
    from src.memory import supabase
    return supabase


class IntegrationSaveRequest(BaseModel):
    provider: str
    is_connected: bool = True
    credentials: Dict[str, Any] = {}


PROVIDER_DEFINITIONS = {
    "instagram": {
        "label": "Instagram DM",
        "icon": "instagram",
        "color": "#e1306c",
        "description": "Connect your Instagram Business page to receive and reply to DMs automatically.",
        "fields": [
            {"key": "page_access_token", "label": "Page Access Token", "type": "password", "required": True,
             "help": "Long-lived Page Access Token from Meta Developer Console → Your App → Instagram → Generate Token"},
            {"key": "instagram_account_id", "label": "Instagram Account ID", "type": "text", "required": True,
             "help": "Your Instagram Business Account ID (numeric). Found in Meta Business Suite."},
            {"key": "webhook_verify_token", "label": "Webhook Verify Token", "type": "text", "required": False,
             "help": "A secret string you choose. Used to verify webhook callbacks from Meta."},
        ]
    },
    "whatsapp": {
        "label": "WhatsApp Business",
        "icon": "whatsapp",
        "color": "#25d366",
        "description": "Connect your WhatsApp Business account to handle customer messages.",
        "fields": [
            {"key": "access_token", "label": "WhatsApp Access Token", "type": "password", "required": True,
             "help": "Permanent access token from Meta Developer Console → WhatsApp → API Setup"},
            {"key": "phone_number_id", "label": "Phone Number ID", "type": "text", "required": True,
             "help": "The numeric Phone Number ID from Meta Developer Console → WhatsApp → API Setup"},
            {"key": "business_account_id", "label": "Business Account ID", "type": "text", "required": False,
             "help": "Your WhatsApp Business Account ID (optional, for analytics)"},
            {"key": "webhook_verify_token", "label": "Webhook Verify Token", "type": "text", "required": False,
             "help": "A secret string you choose. Used to verify webhook callbacks from Meta."},
        ]
    },
    "openai": {
        "label": "OpenAI (AI Replies)",
        "icon": "openai",
        "color": "#10a37f",
        "description": "Your OpenAI API key powers all AI replies, briefings, and summaries. Uses your own credits.",
        "fields": [
            {"key": "api_key", "label": "OpenAI API Key", "type": "password", "required": True,
             "help": "Your OpenAI API key from platform.openai.com/api-keys. Starts with sk-"},
            {"key": "model", "label": "AI Model", "type": "select", "required": False,
             "options": ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-3.5-turbo"],
             "default": "gpt-4o-mini",
             "help": "Model to use for AI replies. gpt-4o-mini is fast and cost-effective."},
        ]
    },
    "facebook": {
        "label": "Facebook Page",
        "icon": "facebook",
        "color": "#1877f2",
        "description": "Connect your Facebook Page to receive and reply to Messenger messages.",
        "fields": [
            {"key": "page_access_token", "label": "Page Access Token", "type": "password", "required": True,
             "help": "Long-lived Page Access Token from Meta Developer Console → Your App → Messenger → Generate Token"},
            {"key": "page_id", "label": "Facebook Page ID", "type": "text", "required": True,
             "help": "Your Facebook Page ID. Found in Page Settings → About → Page ID."},
        ]
    },
    "google": {
        "label": "Google My Business",
        "icon": "google",
        "color": "#4285f4",
        "description": "Connect Google My Business to monitor and respond to reviews.",
        "fields": [
            {"key": "api_key", "label": "Google API Key", "type": "password", "required": True,
             "help": "Google Cloud API Key with Google My Business API enabled."},
            {"key": "location_id", "label": "Location ID", "type": "text", "required": False,
             "help": "Your Google My Business Location ID (optional)."},
        ]
    },
    "webhook": {
        "label": "Custom Webhook",
        "icon": "webhook",
        "color": "#6366f1",
        "description": "Send lead and conversation events to your own endpoint or CRM.",
        "fields": [
            {"key": "url", "label": "Webhook URL", "type": "text", "required": True,
             "help": "The HTTPS URL that will receive POST requests with event data."},
            {"key": "secret", "label": "Webhook Secret", "type": "password", "required": False,
             "help": "Optional secret for HMAC signature verification."},
        ]
    },
}


@router.get("/providers")
async def get_provider_definitions():
    return {"status": "success", "providers": PROVIDER_DEFINITIONS}


@router.get("/")
async def get_integrations(business_id: Optional[str] = Header(None, alias="X-Business-ID")):
    if not business_id:
        business_id = "00000000-0000-0000-0000-000000000000"
    try:
        supabase = _supabase()
        try:
            res = supabase.table("business_integrations").select("*").eq("business_id", business_id).execute()
            integrations_rows = res.data or []
        except Exception:
            integrations_rows = []

        status_map = {}
        for provider_key, provider_def in PROVIDER_DEFINITIONS.items():
            status_map[provider_key] = {
                "is_connected": False,
                "label": provider_def["label"],
                "description": provider_def["description"],
                "fields": provider_def["fields"],
                "credentials": {},
                "last_updated": None,
            }

        for row in integrations_rows:
            prov = row.get("provider")
            if prov in status_map:
                creds = row.get("credentials") or {}
                masked_creds = {}
                for k, v in creds.items():
                    if v and any(s in k for s in ["token", "key", "secret", "password"]):
                        sv = str(v)
                        masked_creds[k] = f"{'*' * 20}{sv[-4:]}" if len(sv) > 4 else "****"
                    else:
                        masked_creds[k] = v
                status_map[prov]["is_connected"] = row.get("is_connected", False)
                status_map[prov]["credentials"] = masked_creds
                status_map[prov]["last_updated"] = row.get("updated_at")

        return {"status": "success", "integrations": status_map}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/save")
async def save_integration(
    data: IntegrationSaveRequest,
    business_id: Optional[str] = Header(None, alias="X-Business-ID")
):
    if not business_id:
        business_id = "00000000-0000-0000-0000-000000000000"
    if data.provider not in PROVIDER_DEFINITIONS:
        raise HTTPException(status_code=400, detail=f"Unknown provider: {data.provider}")
    try:
        supabase = _supabase()
        try:
            existing = supabase.table("business_integrations").select("id, credentials") \
                .eq("business_id", business_id).eq("provider", data.provider).execute()
        except Exception:
            existing = None

        merged_creds = {}
        if existing and existing.data:
            merged_creds = dict(existing.data[0].get("credentials") or {})

        for k, v in data.credentials.items():
            if v and str(v).startswith("********************"):
                continue  # Skip masked values — keep existing
            if v:
                merged_creds[k] = v

        payload = {
            "business_id": business_id,
            "provider": data.provider,
            "is_connected": data.is_connected,
            "credentials": merged_creds,
            "updated_at": datetime.utcnow().isoformat(),
        }

        try:
            if existing and existing.data:
                supabase.table("business_integrations").update(payload).eq("id", existing.data[0]["id"]).execute()
            else:
                supabase.table("business_integrations").insert(payload).execute()
        except Exception as e:
            print(f"INTEGRATION SAVE ERROR: {e}", flush=True)

        return {"status": "success", "message": f"{data.provider} integration saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/disconnect")
async def disconnect_integration(
    provider: str,
    business_id: Optional[str] = Header(None, alias="X-Business-ID")
):
    if not business_id:
        business_id = "00000000-0000-0000-0000-000000000000"
    try:
        supabase = _supabase()
        try:
            supabase.table("business_integrations").update({"is_connected": False}) \
                .eq("business_id", business_id).eq("provider", provider).execute()
        except Exception:
            pass
        return {"status": "success", "message": f"{provider} disconnected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ─── Internal helper used by AI pipeline ─────────────────────────────────────

def get_business_credentials(business_id: str, provider: str) -> dict:
    """Get real (unmasked) credentials for a business+provider. Used by pipeline."""
    try:
        supabase = _supabase()
        res = supabase.table("business_integrations").select("credentials, is_connected") \
            .eq("business_id", business_id).eq("provider", provider).execute()
        if res.data and res.data[0].get("is_connected"):
            return res.data[0].get("credentials") or {}
        return {}
    except Exception:
        return {}
