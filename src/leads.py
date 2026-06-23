from datetime import datetime
from .memory import supabase


def save_lead(
    sender_id: str,
    name: str = "",
    phone: str = "",
    email: str = "",
    location: str = "",
    mode: str = "",
    education: str = "",
    experience: str = "",
    interested_module: str = "",
    notes: str = "",
):
    try:
        existing = (
            supabase.table("leads")
            .select("*")
            .eq("sender_id", sender_id)
            .order("id", desc=True)
            .limit(1)
            .execute()
        )

        old = existing.data[0] if existing.data else {}

        payload = {
            "sender_id": sender_id,
            "name": name or old.get("name", ""),
            "phone": phone or old.get("phone", ""),
            "email": email or old.get("email", ""),
            "location": location or old.get("location", ""),
            "mode": mode or old.get("mode", ""),
            "education": education or old.get("education", ""),
            "experience": experience or old.get("experience", ""),
            "interested_module": interested_module or old.get("interested_module", ""),
            "notes": ((old.get("notes") or "") + "\n" + notes).strip(),
            "status": old.get("status", "new"),
            "updated_at": datetime.utcnow().isoformat(),
        }

        if old.get("id"):
            supabase.table("leads").update(payload).eq("id", old["id"]).execute()
            print("LEAD UPDATED", flush=True)
        else:
            supabase.table("leads").insert(payload).execute()
            print("LEAD SAVED", flush=True)

    except Exception as e:
        print(f"LEAD SAVE ERROR: {e}", flush=True)