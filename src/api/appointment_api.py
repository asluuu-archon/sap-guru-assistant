from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta, timezone
import os
import json

from ..memory import supabase
from ..crm.customer_engine import get_or_create_customer
from ..services.reply_service import send_reply

router = APIRouter(prefix="/appointments", tags=["Appointments"])

# --- Pydantic Models ---
class AppointmentCreate(BaseModel):
    customer_id: str
    summary: str
    description: Optional[str] = None
    start_time: datetime
    end_time: datetime
    attendees: Optional[List[str]] = []
    location: Optional[str] = None
    reminders: Optional[List[int]] = [30] # Default 30 minutes before

class AppointmentUpdate(BaseModel):
    summary: Optional[str] = None
    description: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    attendees: Optional[List[str]] = None
    location: Optional[str] = None
    reminders: Optional[List[int]] = None
    google_event_id: Optional[str] = None

# --- Helper Functions ---
async def call_google_calendar_mcp(tool_name: str, input_args: Dict):
    # This function will call the manus-mcp-cli tool
    # In a real scenario, this would be a direct call to the MCP client library
    # For now, we simulate it with a shell command
    input_json = json.dumps(input_args)
    command = f"manus-mcp-cli tool call {tool_name} --server google-calendar --input '{input_json}'"
    
    # Execute the command and capture output
    # This is a placeholder for actual MCP client integration
    # In a real system, you'd use a Python MCP client library
    print(f"Executing MCP command: {command}")
    # For demonstration, we'll return a dummy success response
    if tool_name == "google_calendar_create_events":
        return {"status": "success", "events": [{"id": "dummy_event_id_123", "htmlLink": "https://calendar.google.com/event?eid=dummy"}]}
    return {"status": "success"}

# --- API Endpoints ---
@router.post("/")
async def create_appointment(appointment: AppointmentCreate, request: Request):
    try:
        # 1. Save appointment to Supabase
        payload = appointment.model_dump()
        payload["created_at"] = datetime.now(timezone.utc).isoformat()
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        res = supabase.table("appointments").insert(payload).execute()
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to save appointment to database")
        
        db_appointment = res.data[0]

        # 2. Create event in Google Calendar via MCP
        event_payload = {
            "summary": appointment.summary,
            "description": appointment.description,
            "start_time": appointment.start_time.isoformat(),
            "end_time": appointment.end_time.isoformat(),
            "attendees": appointment.attendees,
            "location": appointment.location,
            "reminders": appointment.reminders
        }
        
        mcp_response = await call_google_calendar_mcp(
            "google_calendar_create_events",
            {"events": [event_payload]}
        )

        google_event_id = None
        if mcp_response.get("status") == "success" and mcp_response.get("events"):
            google_event_id = mcp_response["events"][0]["id"]
            # Update Supabase with Google Event ID
            supabase.table("appointments").update({"google_event_id": google_event_id}).eq("id", db_appointment["id"]).execute()
            db_appointment["google_event_id"] = google_event_id

        # 3. Notify customer (e.g., via WhatsApp)
        customer = await get_or_create_customer(db_appointment["customer_id"], primary_channel="whatsapp") # Assuming customer_id is whatsapp_id
        if customer and customer.get("phone"):
            message = f"Your appointment '{appointment.summary}' has been scheduled for {appointment.start_time.strftime('%Y-%m-%d %H:%M')}."
            if mcp_response.get("events") and mcp_response["events"][0].get("htmlLink"):
                message += f" View details: {mcp_response["events"][0]["htmlLink"]}"
            send_reply(channel="whatsapp", recipient_id=customer["phone"], message=message)

        return {"status": "success", "appointment": db_appointment}
    except Exception as e:
        print(f"CREATE APPOINTMENT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{customer_id}")
async def get_customer_appointments(customer_id: str):
    try:
        res = supabase.table("appointments").select("*").eq("customer_id", customer_id).order("start_time", desc=True).execute()
        return {"status": "success", "appointments": res.data}
    except Exception as e:
        print(f"GET APPOINTMENTS ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/{appointment_id}")
async def update_appointment(appointment_id: str, updates: AppointmentUpdate):
    try:
        # 1. Update Supabase
        payload = updates.model_dump(exclude_unset=True)
        payload["updated_at"] = datetime.now(timezone.utc).isoformat()
        
        res = supabase.table("appointments").update(payload).eq("id", appointment_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Appointment not found")
        
        updated_db_appointment = res.data[0]

        # 2. Update Google Calendar via MCP if google_event_id exists
        if updated_db_appointment.get("google_event_id"):
            event_update_payload = {
                "event_id": updated_db_appointment["google_event_id"],
                "summary": updates.summary,
                "description": updates.description,
                "start_time": updates.start_time.isoformat() if updates.start_time else None,
                "end_time": updates.end_time.isoformat() if updates.end_time else None,
                "attendees": updates.attendees,
                "location": updates.location,
                "reminders": updates.reminders
            }
            # Filter out None values from event_update_payload
            event_update_payload = {k: v for k, v in event_update_payload.items() if v is not None}

            await call_google_calendar_mcp(
                "google_calendar_update_events",
                {"events": [event_update_payload]}
            )

        return {"status": "success", "appointment": updated_db_appointment}
    except Exception as e:
        print(f"UPDATE APPOINTMENT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{appointment_id}")
async def delete_appointment(appointment_id: str):
    try:
        # 1. Get appointment to retrieve google_event_id
        existing_appointment_res = supabase.table("appointments").select("google_event_id").eq("id", appointment_id).limit(1).execute()
        existing_appointment = existing_appointment_res.data[0] if existing_appointment_res.data else None

        # 2. Delete from Supabase
        supabase.table("appointments").delete().eq("id", appointment_id).execute()

        # 3. Delete from Google Calendar via MCP if google_event_id exists
        if existing_appointment and existing_appointment.get("google_event_id"):
            await call_google_calendar_mcp(
                "google_calendar_delete_events",
                {"events": [{"event_id": existing_appointment["google_event_id"]}]}
            )

        return {"status": "success", "message": "Appointment deleted"}
    except Exception as e:
        print(f"DELETE APPOINTMENT ERROR: {e}")
        raise HTTPException(status_code=500, detail=str(e))
