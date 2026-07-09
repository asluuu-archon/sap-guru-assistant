from ...crm.business_context import get_active_business_context


def run_business_brain_stage(
    organization_id: int,
    message_text: str = "",
) -> dict:
    """
    Business Brain Stage

    Purpose:
    Load active business context for the organization.
    Combines free-text context blocks (v1) and keyword-matched business rules (v2).
    The result is injected into the AI prompt before reply generation.
    """

    business_context = get_active_business_context(
        organization_id=organization_id,
        message_text=message_text,
    )

    return {
        "business_context": business_context or "",
        "has_business_context": bool(business_context),
    }
