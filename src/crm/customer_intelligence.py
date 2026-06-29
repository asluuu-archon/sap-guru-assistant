import re
from datetime import datetime
from ..memory import supabase


def extract_customer_facts(message: str) -> dict:
    text = message or ""
    lower = text.lower()
    facts = {}

    phone = extract_phone(text)
    email = extract_email(text)
    name = extract_name(text)
    location = extract_location(text)

    if phone:
        facts["phone"] = phone

    if email:
        facts["email"] = email

    if name:
        facts["name"] = name
        facts["display_name"] = name

    if location:
        facts["location"] = location

    attributes = {}

    if "bcom" in lower or "b.com" in lower:
        attributes["education"] = "BCom"

    if "mcom" in lower or "m.com" in lower:
        attributes["education"] = "MCom"

    if "mba" in lower:
        attributes["education"] = "MBA"

    if "btech" in lower or "b.tech" in lower or "b tech" in lower:
        attributes["education"] = "BTech"

    if "online" in lower:
        attributes["preferred_mode"] = "Online"

    if "offline" in lower:
        attributes["preferred_mode"] = "Offline"

    module = extract_interest(lower)
    if module:
        attributes["interest"] = module

    experience = extract_experience(lower)
    if experience:
        attributes["experience"] = experience

    if attributes:
        facts["attributes"] = attributes

    return facts


def update_customer_from_message(customer_id: int, message: str) -> dict:
    if not customer_id or not message:
        return {}

    facts = extract_customer_facts(message)

    if not facts:
        return {}

    current = (
        supabase.table("customers")
        .select("*")
        .eq("id", customer_id)
        .limit(1)
        .execute()
    )

    if not current.data:
        return {}

    customer = current.data[0]
    payload = {
        "updated_at": datetime.utcnow().isoformat(),
    }

    for field in ["name", "display_name", "phone", "email", "location"]:
        if facts.get(field) and not customer.get(field):
            payload[field] = facts[field]

    existing_attributes = customer.get("attributes") or {}
    new_attributes = facts.get("attributes") or {}

    merged_attributes = {
        **existing_attributes,
        **new_attributes,
    }

    if new_attributes:
        payload["attributes"] = merged_attributes

    supabase.table("customers").update(payload).eq("id", customer_id).execute()

    return facts


def extract_phone(text: str) -> str:
    match = re.search(r"(\+?\d[\d\s\-]{8,}\d)", text or "")
    return match.group(1).strip() if match else ""


def extract_email(text: str) -> str:
    match = re.search(r"[\w\.-]+@[\w\.-]+\.\w+", text or "")
    return match.group(0).strip() if match else ""


def extract_name(text: str) -> str:
    patterns = [
        r"\bmy name is\s+([A-Za-z][A-Za-z ]{1,40})",
        r"\bthis is\s+([A-Za-z][A-Za-z ]{1,40})",
        r"\bi am\s+([A-Za-z][A-Za-z ]{1,40})",
        r"\bi'm\s+([A-Za-z][A-Za-z ]{1,40})",
    ]

    stop_words = {
        "from",
        "bcom",
        "b.com",
        "mcom",
        "m.com",
        "mba",
        "btech",
        "b.tech",
        "sap",
        "working",
        "completed",
        "interested",
        "looking",
    }

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            words = match.group(1).strip().split()
            clean_words = []

            for word in words:
                if word.lower().strip(".,") in stop_words:
                    break
                clean_words.append(word)

            if clean_words:
                return " ".join(clean_words).title()

    return ""


def extract_location(text: str) -> str:
    patterns = [
        r"\bfrom\s+([A-Za-z][A-Za-z ]{1,40})",
        r"\blocation\s+([A-Za-z][A-Za-z ]{1,40})",
        r"\bi am from\s+([A-Za-z][A-Za-z ]{1,40})",
        r"\bi'm from\s+([A-Za-z][A-Za-z ]{1,40})",
    ]

    stop_words = {
        "and",
        "but",
        "with",
        "i",
        "am",
        "working",
        "looking",
        "interested",
        "sap",
        "online",
        "offline",
    }

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            words = match.group(1).strip().split()
            clean_words = []

            for word in words:
                if word.lower().strip(".,") in stop_words:
                    break
                clean_words.append(word)

            if clean_words:
                return " ".join(clean_words).title()

    return ""


def extract_interest(lower: str) -> str:
    module_map = {
        "sap fico": "SAP FICO",
        "sap mm": "SAP MM",
        "sap sd": "SAP SD",
        "sap abap": "SAP ABAP",
        "sap hcm": "SAP HCM",
        "successfactors": "SAP SuccessFactors",
        "success factors": "SAP SuccessFactors",
        "sap ewm": "SAP EWM",
        "sap btp": "SAP BTP",
        "sap sac": "SAP SAC",
        "sap basis": "SAP Basis",
        "sap security": "SAP Security",
    }

    for keyword, value in module_map.items():
        if keyword in lower:
            return value

    return ""


def extract_experience(lower: str) -> str:
    match = re.search(r"(\d+)\s*(year|years|yr|yrs)", lower)
    if match:
        number = match.group(1)
        return f"{number} years"

    if "fresher" in lower:
        return "Fresher"

    return ""