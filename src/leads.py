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
        payload = {
            "sender_id": sender_id,
            "name": name,
            "phone": phone,
            "email": email,
            "location": location,
            "mode": mode,
            "education": education,
            "experience": experience,
            "interested_module": interested_module,
            "notes": notes,
            "status": "new",
        }

        supabase.table("leads").insert(payload).execute()
        print("LEAD SAVED", flush=True)

    except Exception as e:
        print(f"LEAD SAVE ERROR: {e}", flush=True)