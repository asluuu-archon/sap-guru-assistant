from ..memory import supabase


def load_business_rules(organization_id: int = 1):
    """
    Load all active Business Brain rules.
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