from .matcher import find_matching_rule


def get_business_reply(
    message: str,
    organization_id: int = 1,
):

    rule = find_matching_rule(
        message,
        organization_id,
    )

    if not rule:
        return None

    return {
        "category": rule.get("category", "business_rule"),
        "lead_score": 20,
        "priority": "normal",
        "approval_status": "safe_to_send",
        "should_capture_contact": bool(rule.get("collect_fields")),
        "should_reply": True,
        "human_reason": "",
        "reason": f"Matched Business Brain rule: {rule.get('rule_name')}",
        "suggested_reply": rule.get("response_template", ""),
    }