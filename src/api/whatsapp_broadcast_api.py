from fastapi import APIRouter, Request, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import os
import httpx
import asyncio
from ..memory import supabase
from ..crm.customer_engine import get_customer_by_id

router = APIRouter(tags=["WhatsApp Broadcasts"])

WHATSAPP_API_URL = "https://graph.facebook.com/v23.0"

class TemplateCreate(BaseModel):
    name: str
    language: str
    category: str
    components: List[Dict]

class BroadcastMessage(BaseModel):
    template_name: str
    language: str
    components: Optional[List[Dict]] = []
    recipient_ids: List[str] # List of customer_ids

@router.post("/whatsapp/templates")
async def create_whatsapp_template(template: TemplateCreate, request: Request):
    business_id = request.headers.get("X-Business-ID")
    if not business_id: raise HTTPException(status_code=400, detail="X-Business-ID header required")

    token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    whatsapp_business_account_id = os.getenv("WHATSAPP_BUSINESS_ACCOUNT_ID")

    if not token or not whatsapp_business_account_id:
        raise HTTPException(status_code=400, detail="WhatsApp access token or business account ID not configured")

    url = f"{WHATSAPP_API_URL}/{whatsapp_business_account_id}/message_templates"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "name": template.name,
        "language": template.language,
        "category": template.category,
        "components": template.components
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        if response.status_code != 200: 
            print(f"Error creating template: {response.text}", flush=True)
            raise HTTPException(status_code=response.status_code, detail=response.json())
        
        # Save template to Supabase
        try:
            supabase.table("whatsapp_templates").insert({
                "business_id": business_id,
                "template_id": response.json().get("id"),
                "name": template.name,
                "language": template.language,
                "category": template.category,
                "components": template.components,
                "status": "PENDING"
            }).execute()
        except Exception as e:
            print(f"Error saving template to DB: {e}", flush=True)

        return response.json()

@router.get("/whatsapp/templates")
async def get_whatsapp_templates(request: Request):
    business_id = request.headers.get("X-Business-ID")
    if not business_id: raise HTTPException(status_code=400, detail="X-Business-ID header required")

    # Fetch from Supabase
    try:
        templates = supabase.table("whatsapp_templates").select("*").eq("business_id", business_id).execute()
        return {"status": "success", "templates": templates.data}
    except Exception as e:
        print(f"Error fetching templates from DB: {e}", flush=True)
        raise HTTPException(status_code=500, detail="Failed to fetch templates")

async def _send_whatsapp_template_message(recipient_phone_number: str, template_name: str, language: str, components: List[Dict], token: str, phone_number_id: str):
    url = f"{WHATSAPP_API_URL}/{phone_number_id}/messages"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "messaging_product": "whatsapp",
        "to": recipient_phone_number,
        "type": "template",
        "template": {
            "name": template_name,
            "language": {"code": language},
            "components": components
        }
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(url, headers=headers, json=payload)
        return response.json()

@router.post("/whatsapp/broadcast")
async def send_whatsapp_broadcast(broadcast: BroadcastMessage, request: Request, background_tasks: BackgroundTasks):
    business_id = request.headers.get("X-Business-ID")
    if not business_id: raise HTTPException(status_code=400, detail="X-Business-ID header required")

    token = os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_number_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")

    if not token or not phone_number_id:
        raise HTTPException(status_code=400, detail="WhatsApp access token or phone number ID not configured")

    # Fetch recipient phone numbers from customer_ids
    recipient_phone_numbers = []
    for customer_id in broadcast.recipient_ids:
        customer = await get_customer_by_id(customer_id)
        if customer and customer.get("phone"):
            recipient_phone_numbers.append(customer["phone"])
    
    if not recipient_phone_numbers:
        raise HTTPException(status_code=400, detail="No valid recipient phone numbers found for broadcast")

    # Send messages in background
    async def _send_messages_task():
        tasks = []
        for phone_number in recipient_phone_numbers:
            tasks.append(_send_whatsapp_template_message(
                phone_number,
                broadcast.template_name,
                broadcast.language,
                broadcast.components,
                token,
                phone_number_id
            ))
        await asyncio.gather(*tasks)

    background_tasks.add_task(_send_messages_task)

    return {"status": "success", "message": "Broadcast initiated in background"}

# TODO: Implement opt-out handling and tracking logic
