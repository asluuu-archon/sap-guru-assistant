from datetime import datetime
from .memory import supabase


def has_real_lead_data(
    name: str = "",
    phone: str = "",
    email: str = "",
    location: str = "",
    mode: str = "",
    education: str = "",
    experience: str = "",
):
    return any([
        name.strip(),
        phone.strip(),
        email.strip(),
        location.strip(),
        mode.strip(),
        education.strip(),
        experience.strip(),
    ])


def determine_lead_stage(
    name: str = "",
    phone: str = "",
    email: str = "",
    location: str = "",
    mode: str = "",
):
    if phone and email:
        return "qualified"

    if not phone:
        return "phone_pending"

    if not name:
        return "name_pending"

    if not location:
        return "location_pending"

    if not mode:
        return "mode_pending"

    return "email_pending"


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

        final_name = name or old.get("name", "")
        final_phone = phone or old.get("phone", "")
        final_email = email or old.get("email", "")
        final_location = location or old.get("location", "")
        final_mode = mode or old.get("mode", "")
        final_education = education or old.get("education", "")
        final_experience = experience or old.get("experience", "")
        final_module = interested_module or old.get("interested_module", "")

        if not old.get("id") and not has_real_lead_data(
            name=final_name,
            phone=final_phone,
            email=final_email,
            location=final_location,
            mode=final_mode,
            education=final_education,
            experience=final_experience,
        ):
            print("LEAD NOT SAVED: no real lead data", flush=True)
            return

        is_qualified = bool(final_phone) and bool(final_email)
        qualified_at = old.get("qualified_at")

        if is_qualified and not qualified_at:
            qualified_at = datetime.utcnow().isoformat()

        lead_stage = determine_lead_stage(
            name=final_name,
            phone=final_phone,
            email=final_email,
            location=final_location,
            mode=final_mode,
        )

        status = "qualified" if is_qualified else old.get("status", "new")

        payload = {
            "sender_id": sender_id,
            "name": final_name,
            "phone": final_phone,
            "email": final_email,
            "location": final_location,
            "mode": final_mode,
            "education": final_education,
            "experience": final_experience,
            "interested_module": final_module,
            "notes": ((old.get("notes") or "") + "\n" + notes).strip(),
            "status": status,
            "lead_stage": lead_stage,
            "is_qualified": is_qualified,
            "qualified_at": qualified_at,
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