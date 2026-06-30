from ...crm.customer_intelligence import update_customer_from_message


def run_customer_brain_stage(
    customer_id: int,
    message_text: str,
) -> dict:
    """
    Customer Brain Stage

    Purpose:
    Learn useful customer facts from the current message.

    This stage does not generate replies.
    It only enriches the customer profile.
    """

    if not customer_id or not message_text:
        return {
            "facts": {},
            "facts_found": False,
        }

    facts = update_customer_from_message(
        customer_id=customer_id,
        message=message_text,
    )

    return {
        "facts": facts or {},
        "facts_found": bool(facts),
    }