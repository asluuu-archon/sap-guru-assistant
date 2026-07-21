"""
Overview API

Real columns in conversations table:
sender_id, summary, last_question, last_reply, history,
updated_at, first_message_at, ai_replied, manual_replied,
pending_reply, needs_human, human_reason, conversation_state,
closed_at, state_reason

NO category column, NO created_at column.
"""

from fastapi import APIRouter, Header
from typing import Optional
from datetime import datetime, timedelta, timezone
from collections import defaultdict

from ..memory import supabase

router = APIRouter()


def safe_date(val):
    """Parse an ISO date string safely, return timezone-aware datetime or None."""
    if not val:
        return None
    try:
        if val.endswith("Z"):
            val = val[:-1] + "+00:00"
        dt = datetime.fromisoformat(val)
        # Always return timezone-aware datetime (assume UTC if naive)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None


@router.get("/overview")
def overview(business_id: Optional[str] = Header(None, alias="X-Business-ID")):
    try:
        biz = business_id or None
        now = datetime.now(timezone.utc)
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        yesterday_start = today_start - timedelta(days=1)
        seven_days_ago = today_start - timedelta(days=7)

        # ─── FETCH DATA ───────────────────────────────────────────────────────

        # All leads
        leads_q = supabase.table("leads").select("*")
        if biz:
            leads_q = leads_q.eq("business_id", biz)
        leads_result = leads_q.execute()
        all_leads = leads_result.data or []

        # All conversations — only real columns
        convs_q = (
            supabase.table("conversations")
            .select(
                "sender_id, updated_at, first_message_at, needs_human, "
                "conversation_state, ai_replied, manual_replied, pending_reply"
            )
        )
        if biz:
            convs_q = convs_q.eq("business_id", biz)
        convs_result = convs_q.execute()
        all_convs = convs_result.data or []

        # Customer name map
        cust_q = supabase.table("customers").select("channel_user_id, name")
        if biz:
            cust_q = cust_q.eq("business_id", biz)
        customers_result = cust_q.execute()
        customer_name_map = {
            c["channel_user_id"]: c.get("name", "")
            for c in (customers_result.data or [])
        }

        # ─── STAT CARDS ───────────────────────────────────────────────────────

        total_leads = len(all_leads)
        total_conversations = len(all_convs)

        hot_leads = sum(1 for l in all_leads if l.get("temperature") == "hot")
        warm_leads = sum(1 for l in all_leads if l.get("temperature") == "warm")
        cold_leads = sum(1 for l in all_leads if l.get("temperature") == "cold")

        qualified_leads = sum(
            1 for l in all_leads
            if l.get("is_qualified") or l.get("status") == "qualified"
        )

        needs_human_count = sum(
            1 for c in all_convs
            if c.get("needs_human") or c.get("conversation_state") == "needs_human"
        )

        # New leads today — use updated_at as proxy (leads table has updated_at)
        new_leads_today = sum(
            1 for l in all_leads
            if safe_date(l.get("updated_at")) and
               safe_date(l.get("updated_at")) >= today_start
        )

        new_leads_yesterday = sum(
            1 for l in all_leads
            if safe_date(l.get("updated_at")) and
               yesterday_start <= safe_date(l.get("updated_at")) < today_start
        )

        leads_with_phone = sum(1 for l in all_leads if l.get("phone") and str(l["phone"]).strip())
        leads_with_email = sum(1 for l in all_leads if l.get("email") and str(l["email"]).strip())

        # ─── TEMPERATURE BREAKDOWN ────────────────────────────────────────────

        temperature_breakdown = [
            {"label": "Hot", "value": hot_leads, "color": "#ef4444"},
            {"label": "Warm", "value": warm_leads, "color": "#f59e0b"},
            {"label": "Cold", "value": cold_leads, "color": "#3b82f6"},
        ]

        # ─── MODULE BREAKDOWN ─────────────────────────────────────────────────

        module_counts = defaultdict(int)
        for lead in all_leads:
            mod = lead.get("interested_module")
            if mod and str(mod).strip():
                module_counts[str(mod).strip()] += 1

        top_modules = sorted(module_counts.items(), key=lambda x: x[1], reverse=True)[:6]
        module_breakdown = [{"label": m, "value": c} for m, c in top_modules]

        # ─── STAGE BREAKDOWN ──────────────────────────────────────────────────

        stage_counts = defaultdict(int)
        for lead in all_leads:
            stage = lead.get("lead_stage") or lead.get("status") or "new"
            stage_counts[stage] += 1

        stage_breakdown = [
            {"label": s.replace("_", " ").title(), "value": c}
            for s, c in sorted(stage_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        # ─── 7-DAY ACTIVITY CHART ─────────────────────────────────────────────

        chart_days = {}
        for i in range(6, -1, -1):
            day = today_start - timedelta(days=i)
            label = day.strftime("%a")
            chart_days[day.date()] = {"day": label, "leads": 0, "conversations": 0}

        for lead in all_leads:
            dt = safe_date(lead.get("updated_at"))
            if dt and dt >= seven_days_ago:
                day_key = dt.date()
                if day_key in chart_days:
                    chart_days[day_key]["leads"] += 1

        for conv in all_convs:
            # Use first_message_at if available, otherwise updated_at
            dt = safe_date(conv.get("first_message_at") or conv.get("updated_at"))
            if dt and dt >= seven_days_ago:
                day_key = dt.date()
                if day_key in chart_days:
                    chart_days[day_key]["conversations"] += 1

        activity_chart = list(chart_days.values())

        # ─── RECENT LEADS ─────────────────────────────────────────────────────

        sorted_leads = sorted(
            all_leads,
            key=lambda l: l.get("updated_at") or "",
            reverse=True
        )[:10]

        recent_leads = []
        for lead in sorted_leads:
            sid = lead.get("sender_id", "")
            name = (
                lead.get("name") or
                customer_name_map.get(sid) or
                (f"User ...{sid[-4:]}" if sid else "Unknown")
            )
            recent_leads.append({
                "id": lead.get("id"),
                "name": name,
                "sender_id": sid,
                "phone": lead.get("phone") or "",
                "email": lead.get("email") or "",
                "interested_module": lead.get("interested_module") or "",
                "temperature": lead.get("temperature") or "cold",
                "lead_stage": lead.get("lead_stage") or lead.get("status") or "new",
                "is_qualified": lead.get("is_qualified") or False,
                "updated_at": lead.get("updated_at") or "",
            })

        # ─── NEEDS HUMAN LIST ─────────────────────────────────────────────────

        needs_human_list = [
            {
                "sender_id": c.get("sender_id"),
                "name": customer_name_map.get(c.get("sender_id") or "", f"User ...{str(c.get('sender_id', ''))[-4:]}"),
                "state": c.get("conversation_state"),
                "updated_at": c.get("updated_at"),
            }
            for c in all_convs
            if c.get("needs_human") or c.get("conversation_state") == "needs_human"
        ][:10]

        # ─── RESPONSE ─────────────────────────────────────────────────────────

        return {
            "status": "success",
            "generated_at": now.isoformat(),
            "stat_cards": {
                "total_leads": total_leads,
                "total_conversations": total_conversations,
                "hot_leads": hot_leads,
                "warm_leads": warm_leads,
                "cold_leads": cold_leads,
                "qualified_leads": qualified_leads,
                "needs_human": needs_human_count,
                "new_leads_today": new_leads_today,
                "new_leads_yesterday": new_leads_yesterday,
                "leads_with_phone": leads_with_phone,
                "leads_with_email": leads_with_email,
            },
            "temperature_breakdown": temperature_breakdown,
            "module_breakdown": module_breakdown,
            "stage_breakdown": stage_breakdown,
            "activity_chart": activity_chart,
            "recent_leads": recent_leads,
            "needs_human_list": needs_human_list,
        }

    except Exception as e:
        import traceback
        print(f"OVERVIEW ERROR: {e}", flush=True)
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
