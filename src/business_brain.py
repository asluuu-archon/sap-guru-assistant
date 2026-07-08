from .memory import supabase


def load_business_rules(organization_id: int = 1):
    """
    Returns all active Business Brain rules for an organization.
    """

    try:
        result = (
            supabase.table("business_rules")
            .select("*")
            .eq("organization_id", organization_id)
            .eq("is_active", True)
            .order("priority")
            .execute()
        )

        return result.data or []

    except Exception as e:
        print(f"BUSINESS BRAIN ERROR: {e}", flush=True)
        return []


def find_matching_rule(message: str, organization_id: int = 1):
    """
    Finds the first matching Business Brain rule.
    """

    message = (message or "").lower()

    rules = load_business_rules(organization_id)

    for rule in rules:

        keywords = rule.get("trigger_keywords") or []

        for keyword in keywords:

            if keyword.lower() in message:
                return rule

    return None