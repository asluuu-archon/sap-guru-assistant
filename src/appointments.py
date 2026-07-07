from datetime import datetime
from .memory import supabase


def save_appointment_request(
    sender_id: str,
    message_text: str,
    customer_id: int | None = None,
    organization_id: int = 1,
    channel: str = "instagram",
    email: str = "",
    requested_day: str = "",
    requested_time: str = "",
    timezone: str = "",
    notes: str = "",
):
    try:
        payload = {
            "organization_id": organization_id,
            "sender_id": sender_id,
            "customer_id": customer_id,
            "channel": channel,
            "email": email,
            "requested_day": requested_day,
            "requested_time": requested_time,
            "timezone": timezone,
            "notes": notes,
            "raw_message": message_text,
            "status": "pending",
            "updated_at": datetime.utcnow().isoformat(),
        }

        supabase.table("appointments").insert(payload).execute()
        print("APPOINTMENT REQUEST SAVED", flush=True)

    except Exception as e:
        print(f"APPOINTMENT SAVE ERROR: {e}", flush=True)