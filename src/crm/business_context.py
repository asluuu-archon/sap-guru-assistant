"""
Business Context Loader

Loads active business context for the organisation to inject into AI prompts.

This module reads from TWO sources:
1. business_contexts table — free-text context blocks (legacy v1)
2. business_rules table — structured keyword-triggered rules (v2 Business Brain)

Both are combined and returned as a single context string.
"""

from ..memory import supabase


def get_active_business_context(
    organization_id: int = 1,
    message_text: str = "",
    limit: int = 5,
) -> str:
    """
    Returns active business context for the organization.
    Combines free-text context blocks and matched business rules.
    This is injected into the AI prompt before generating a reply.
    """

    lines = []

    # --- Source 1: business_contexts (free-text blocks, legacy v1) ---
    try:
        result = (
            supabase.table("business_contexts")
            .select("title,context_text")
            .eq("organization_id", organization_id)
            .eq("status", "active")
            .order("priority", desc=True)
            .order("updated_at", desc=True)
            .limit(limit)
            .execute()
        )

        for row in (result.data or []):
            title = row.get("title", "").strip()
            context_text = row.get("context_text", "").strip()
            if title or context_text:
                lines.append(f"{title}: {context_text}".strip(": "))

    except Exception as e:
        print(f"BUSINESS_CONTEXT_LOAD_ERROR: {e}", flush=True)

    # --- Source 2: business_rules (keyword-triggered structured rules, v2) ---
    try:
        rules_result = (
            supabase.table("business_rules")
            .select("rule_name,response_template,trigger_keywords,category")
            .eq("organization_id", organization_id)
            .eq("is_active", True)
            .order("priority", desc=True)
            .limit(20)
            .execute()
        )

        rules = rules_result.data or []
        message_lower = (message_text or "").lower()

        matched_rules = []
        seen_templates = set()

        for rule in rules:
            keywords = rule.get("trigger_keywords") or []
            template = rule.get("response_template", "").strip()
            rule_name = rule.get("rule_name", "")

            # Skip duplicate templates (e.g. 3 identical Default Greeting rows)
            if template in seen_templates:
                continue

            # Match if any keyword appears in the message
            if keywords and message_lower:
                if any(kw.lower() in message_lower for kw in keywords):
                    matched_rules.append(f"Business Rule [{rule_name}]: {template}")
                    seen_templates.add(template)
            elif not message_lower:
                # No message yet — include all active rules as general context
                matched_rules.append(f"Business Rule [{rule_name}]: {template}")
                seen_templates.add(template)

        lines.extend(matched_rules)

    except Exception as e:
        print(f"BUSINESS_RULES_LOAD_ERROR: {e}", flush=True)

    return "\n".join(lines)
