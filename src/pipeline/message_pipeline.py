"""
Message Pipeline

Central orchestrator for incoming messages.
Phase 1: Customer Engine only.
"""

from ..crm.customer_engine import get_or_create_customer


def process_incoming_message(
    organization_id: int,
    channel: str,
    sender_id: str,
    message_text: str,
    raw_payload: dict | None = None,
) -> dict:
    if not organization_id:
        organization_id = 1

    if not channel:
        channel = "instagram"

    if not sender_id:
        return {
            "status": "error",
            "message": "sender_id is required",
        }

    customer = get_or_create_customer(
        channel_user_id=sender_id,
        primary_channel=channel,
        organization_id=organization_id,
    )

    return {
        "status": "success",
        "organization_id": organization_id,
        "channel": channel,
        "sender_id": sender_id,
        "message_text": message_text or "",
        "customer": customer,
        "customer_id": customer.get("id") if customer else None,
        "raw_payload_available": raw_payload is not None,
    }