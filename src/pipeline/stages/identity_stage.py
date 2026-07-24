from ...identity.identity_engine import (
    build_basic_identity,
    update_customer_identity,
    trigger_background_identity_enrichment,
)


def run_identity_stage(
    customer_id: int,
    channel: str,
    sender_id: str,
    raw_payload: dict | None = None,
    business_id: str = None,
) -> dict:
    # Step 1: Extract identity from webhook payload (synchronous, instant)
    identity = build_basic_identity(
        channel=channel,
        channel_user_id=sender_id,
        raw_payload=raw_payload or {},
    )

    # Step 2: Save whatever we found to the customer record
    update_customer_identity(
        customer_id=customer_id,
        identity=identity,
    )

    # Step 3: Fire background enrichment (non-blocking)
    # For Instagram: fetches real name/username from Graph API
    # For WhatsApp: name already extracted from webhook payload above
    trigger_background_identity_enrichment(
        customer_id=customer_id,
        channel=channel,
        sender_id=sender_id,
        business_id=business_id,
    )

    return {
        "identity": identity,
        "identity_updated": True,
    }
