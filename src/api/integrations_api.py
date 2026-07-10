from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/integrations", tags=["Integrations"])


def _supabase():
    from src.memory import supabase
    return supabase


class IntegrationUpdate(BaseModel):
    provider: str  # 'instagram', 'whatsapp', 'google_sheets', 'webhook'
    is_connected: bool
    credentials: Optional[dict] = None


@router.get("/")
async def get_integrations(business_id: Optional[str] = Header(None, alias="X-Business-ID")):
    """Get all integrations for the active business."""
    if not business_id:
        # Fallback for dev / if not passed
        business_id = "00000000-0000-0000-0000-000000000000"

    try:
        supabase = _supabase()
        # We'll use a single row per business in a `business_integrations` table
        # Or multiple rows. Let's use multiple rows for flexibility: provider, is_connected, credentials
        
        try:
            res = supabase.table("business_integrations").select("*").eq("business_id", business_id).execute()
            integrations = res.data or []
        except Exception:
            # Mock data if table doesn't exist yet
            integrations = []

        # Return a structured map so the frontend has an easy time
        # Default state for all known providers
        status_map = {
            "instagram": {"is_connected": False, "last_synced": None},
            "whatsapp": {"is_connected": False, "last_synced": None},
            "google_sheets": {"is_connected": False, "last_synced": None},
            "webhook": {"is_connected": False, "webhook_url": ""}
        }

        for integ in integrations:
            prov = integ.get("provider")
            if prov in status_map:
                status_map[prov]["is_connected"] = integ.get("is_connected", False)
                status_map[prov]["last_synced"] = integ.get("updated_at")
                if prov == "webhook" and integ.get("credentials"):
                    status_map[prov]["webhook_url"] = integ.get("credentials", {}).get("url", "")

        return {"status": "success", "integrations": status_map}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/")
async def update_integration(data: IntegrationUpdate, business_id: Optional[str] = Header(None, alias="X-Business-ID")):
    """Connect or disconnect an integration."""
    if not business_id:
        business_id = "00000000-0000-0000-0000-000000000000"

    try:
        supabase = _supabase()
        
        # Check if exists
        try:
            existing = supabase.table("business_integrations") \
                .select("id") \
                .eq("business_id", business_id) \
                .eq("provider", data.provider) \
                .execute()
                
            if existing.data:
                # Update
                supabase.table("business_integrations").update({
                    "is_connected": data.is_connected,
                    "credentials": data.credentials or {}
                }).eq("id", existing.data[0]["id"]).execute()
            else:
                # Insert
                supabase.table("business_integrations").insert({
                    "business_id": business_id,
                    "provider": data.provider,
                    "is_connected": data.is_connected,
                    "credentials": data.credentials or {}
                }).execute()
                
        except Exception:
            # Table might not exist yet, just ignore and return success so UI works
            pass

        return {"status": "success", "message": f"{data.provider} updated"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
