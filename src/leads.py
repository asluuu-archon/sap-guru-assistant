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
    interested_module: str = "",
    notes: str = "",
):
    return any([
        name.strip(),
        phone.strip(),
        email.strip(),
        location.strip(),
        mode.strip(),
        education.strip(),
        experience.strip(),
        interested_module.strip(),
        notes.strip(),
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


def determine_temperature(
    phone: str = "",
    email: str = "",
    interested_module: str = "",
    location: str = "",
    mode: str = "",
    name: str = "",
) -> str:
    """
    Determine lead temperature based on how much information has been provided.

    hot  = has BOTH phone AND email (fully qualified, ready to contact)
    warm = has phone OR email OR interested_module (partial info, showing intent)
    cold = no contact details at all (just started)
    """
    has_phone = bool(phone and phone.strip())
    has_email = bool(email and email.strip())
    has_module = bool(interested_module and interested_module.strip())
    has_location = bool(location and location.strip())
    has_mode = bool(mode and mode.strip())

    if has_phone and has_email:
        return "hot"

    if has_phone or has_email or has_module or has_location or has_mode:
        return "warm"

    return "cold"


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
    source: str = "instagram",
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
        
        # If name is still missing, try to fetch from customer profile
        if not final_name:
            cust_res = supabase.table("customers").select("name").eq("channel_user_id", sender_id).limit(1).execute()
            if cust_res.data and cust_res.data[0].get("name"):
                final_name = cust_res.data[0].get("name")
        final_phone = phone or old.get("phone", "")
        final_email = email or old.get("email", "")
        final_location = location or old.get("location", "")
        final_mode = mode or old.get("mode", "")
        final_education = education or old.get("education", "")
        final_experience = experience or old.get("experience", "")
        final_module = interested_module or old.get("interested_module", "")
        final_notes = ((old.get("notes") or "") + "\n" + notes).strip()

        if not old.get("id") and not has_real_lead_data(
            name=final_name,
            phone=final_phone,
            email=final_email,
            location=final_location,
            mode=final_mode,
            education=final_education,
            experience=final_experience,
            interested_module=final_module,
            notes=final_notes,
        ):
            print("LEAD NOT SAVED: no useful lead data", flush=True)
            return None

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

        temperature = determine_temperature(
            phone=final_phone,
            email=final_email,
            interested_module=final_module,
            location=final_location,
            mode=final_mode,
            name=final_name,
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
            "notes": final_notes,
            "source": source,
            "status": status,
            "lead_stage": lead_stage,
            "is_qualified": is_qualified,
            "qualified_at": qualified_at,
            "temperature": temperature,
            "updated_at": datetime.utcnow().isoformat(),
        }

        if old.get("id"):
            result = (
                supabase.table("leads")
                .update(payload)
                .eq("id", old["id"])
                .execute()
            )

            if result.data:
                print(f"LEAD UPDATED: {result.data[0].get('id')} | temp={temperature}", flush=True)
                return result.data[0]

            print("LEAD UPDATE WARNING: no data returned", flush=True)
            return None

        result = supabase.table("leads").insert(payload).execute()

        if result.data:
            print(f"LEAD SAVED: {result.data[0].get('id')} | temp={temperature}", flush=True)
            return result.data[0]

        print("LEAD INSERT WARNING: no data returned", flush=True)
        return None

    except Exception as e:
        print(f"LEAD SAVE ERROR: {e}", flush=True)
        return None