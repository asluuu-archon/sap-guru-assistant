from .loader import load_business_rules


def find_matching_rule(
    message: str,
    organization_id: int = 1,
):

    message = (message or "").lower()

    rules = load_business_rules(organization_id)

    for rule in rules:

        keywords = rule.get("trigger_keywords") or []

        for keyword in keywords:

            if keyword.lower() in message:

                return rule

    return None