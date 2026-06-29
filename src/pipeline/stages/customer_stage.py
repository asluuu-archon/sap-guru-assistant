from ...crm.customer_engine import get_or_create_customer


def run_customer_stage(
    organization_id: int,
    channel: str,
    sender_id: str,
) -> dict:
    customer = get_or_create_customer(
        channel_user_id=sender_id,
        primary_channel=channel,
        organization_id=organization_id,
    )

    return {
        "customer": customer,
        "customer_id": customer.get("id") if customer else None,
    }