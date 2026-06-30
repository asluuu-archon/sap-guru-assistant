from ...crm.business_context import get_active_business_context


def run_business_brain_stage(
    organization_id: int,
) -> dict:
    """
    Business Brain Stage

    Purpose:
    Load active business context for the organization.
    """

    business_context = get_active_business_context(
        organization_id=organization_id,
    )

    return {
        "business_context": business_context or "",
        "has_business_context": bool(business_context),
    }