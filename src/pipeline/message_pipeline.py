"""
Message Pipeline

Central orchestrator for incoming messages.
Phase 2: Uses Customer Stage.
"""

from .stages.customer_stage import run_customer_stage


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

    customer_result = run_customer_stage(
        organization_id=organization_id,
        channel=channel,
        sender_id=sender_id,
    )

    return {
        "status": "success",
        "organization_id": organization_id,
        "channel": channel,
        "sender_id": sender_id,
        "message_text": message_text or "",
        "customer": customer_result.get("customer"),
        "customer_id": customer_result.get("customer_id"),
        "raw_payload_available": raw_payload is not None,
    }