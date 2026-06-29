from ..memory import supabase


def get_active_business_context(
    organization_id: int = 1,
    limit: int = 5,
) -> str:
    """
    Returns active business context for the organization.
    This will be injected into AI prompt later.
    """

    result = (
        supabase.table("business_contexts")
        .select("*")
        .eq("organization_id", organization_id)
        .eq("status", "active")
        .order("priority", desc=True)
        .order("updated_at", desc=True)
        .limit(limit)
        .execute()
    )

    rows = result.data or []

    if not rows:
        return ""

    lines = []

    for row in rows:
        title = row.get("title", "")
        context_text = row.get("context_text", "")

        if title or context_text:
            lines.append(f"{title}: {context_text}".strip(": "))

    return "\n".join(lines)