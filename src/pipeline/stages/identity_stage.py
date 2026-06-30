from ...identity.identity_engine import build_basic_identity, update_customer_identity


def run_identity_stage(
    customer_id: int,
    channel: str,
    sender_id: str,
    raw_payload: dict | None = None,
) -> dict:
    identity = build_basic_identity(
        channel=channel,
        channel_user_id=sender_id,
        raw_payload=raw_payload or {},
    )

    update_customer_identity(
        customer_id=customer_id,
        identity=identity,
    )

    return {
        "identity": identity,
        "identity_updated": True,
    }