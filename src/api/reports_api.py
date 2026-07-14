"""
Reports API — comprehensive analytics and CSV export endpoints.
All data pulled from Supabase leads and conversations tables.
"""

from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import csv
import io

router = APIRouter()

# ── helpers ────────────────────────────────────────────────────────────────────

def _supabase():
    from src.memory import supabase
    return supabase

def _parse_dt(val):
    """Parse a Supabase timestamp string to a timezone-aware datetime."""
    if not val:
        return None
    try:
        s = val.replace("Z", "+00:00")
        if "+" not in s and len(s) == 26:
            s += "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

def _days_ago(n):
    return datetime.now(timezone.utc) - timedelta(days=n)


# ── GET /reports ───────────────────────────────────────────────────────────────

@router.get("/reports")
def get_reports(days: int = 30):
    """
    Returns comprehensive report data for the given time window (default 30 days).
    Includes: summary cards, daily lead trend, module breakdown, temperature split,
    stage funnel, source breakdown, conversation stats, and top leads list.
    """
    try:
        supabase = _supabase()
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(days=days)

        # ── 1. Fetch all leads ─────────────────────────────────────────────────
        leads_res = supabase.table("leads").select("*").execute()
        all_leads = leads_res.data or []

        # ── 2. Fetch all conversations ─────────────────────────────────────────
        conv_res = supabase.table("conversations").select(
            "sender_id, ai_replied, manual_replied, needs_human, pending_reply, updated_at, first_message_at"
        ).execute()
        all_convs = conv_res.data or []

        # ── 3. Filter leads within window ──────────────────────────────────────
        window_leads = []
        for l in all_leads:
            dt = _parse_dt(l.get("created_at") or l.get("updated_at"))
            if dt and dt >= window_start:
                window_leads.append(l)

        # ── 4. Summary cards ───────────────────────────────────────────────────
        total_leads = len(all_leads)
        window_total = len(window_leads)
        hot_leads = sum(1 for l in all_leads if l.get("temperature") == "hot")
        warm_leads = sum(1 for l in all_leads if l.get("temperature") == "warm")
        cold_leads = sum(1 for l in all_leads if l.get("temperature") == "cold")
        qualified = sum(1 for l in all_leads if l.get("is_qualified"))
        with_phone = sum(1 for l in all_leads if l.get("phone"))
        with_email = sum(1 for l in all_leads if l.get("email"))
        needs_human = sum(1 for c in all_convs if c.get("needs_human"))
        ai_replied = sum(1 for c in all_convs if c.get("ai_replied"))
        total_convs = len(all_convs)

        # Conversion rate: qualified / total
        conversion_rate = round((qualified / total_leads * 100), 1) if total_leads else 0
        contact_rate = round(((with_phone + with_email) / total_leads * 100), 1) if total_leads else 0

        # ── 5. Daily lead trend (last N days) ──────────────────────────────────
        daily_counts = defaultdict(lambda: {"leads": 0, "conversations": 0})

        for l in all_leads:
            dt = _parse_dt(l.get("created_at") or l.get("updated_at"))
            if dt and dt >= window_start:
                day_key = dt.strftime("%Y-%m-%d")
                daily_counts[day_key]["leads"] += 1

        for c in all_convs:
            dt = _parse_dt(c.get("first_message_at") or c.get("updated_at"))
            if dt and dt >= window_start:
                day_key = dt.strftime("%Y-%m-%d")
                daily_counts[day_key]["conversations"] += 1

        # Build full date range
        daily_trend = []
        for i in range(days - 1, -1, -1):
            day = (now - timedelta(days=i)).strftime("%Y-%m-%d")
            daily_trend.append({
                "date": day,
                "label": (now - timedelta(days=i)).strftime("%b %d"),
                "leads": daily_counts[day]["leads"],
                "conversations": daily_counts[day]["conversations"],
            })

        # ── 6. Module breakdown ────────────────────────────────────────────────
        module_counts = defaultdict(int)
        for l in all_leads:
            mod = l.get("interested_module") or "unknown"
            if mod not in ("", None, "lead_information", "greeting", "general"):
                module_counts[mod] += 1

        module_breakdown = sorted(
            [{"module": k, "count": v} for k, v in module_counts.items()],
            key=lambda x: x["count"], reverse=True
        )[:10]

        # ── 7. Temperature split ───────────────────────────────────────────────
        temperature_split = [
            {"name": "Hot", "value": hot_leads, "color": "#ef4444"},
            {"name": "Warm", "value": warm_leads, "color": "#f59e0b"},
            {"name": "Cold", "value": cold_leads, "color": "#3b82f6"},
        ]

        # ── 8. Stage funnel ────────────────────────────────────────────────────
        stage_counts = defaultdict(int)
        for l in all_leads:
            stage = l.get("lead_stage") or "unknown"
            stage_counts[stage] += 1

        # Map to funnel order
        funnel_order = [
            "name_pending", "phone_pending", "location_pending",
            "mode_pending", "qualified", "converted"
        ]
        funnel_labels = {
            "name_pending": "Name Pending",
            "phone_pending": "Phone Pending",
            "location_pending": "Location Pending",
            "mode_pending": "Mode Pending",
            "qualified": "Qualified",
            "converted": "Converted",
        }
        stage_funnel = []
        for s in funnel_order:
            if stage_counts.get(s, 0) > 0:
                stage_funnel.append({
                    "stage": funnel_labels.get(s, s),
                    "count": stage_counts[s]
                })
        # Add any other stages not in the predefined order
        for s, cnt in sorted(stage_counts.items(), key=lambda x: -x[1]):
            if s not in funnel_order and cnt > 0:
                stage_funnel.append({"stage": s, "count": cnt})

        # ── 9. Source breakdown ────────────────────────────────────────────────
        source_counts = defaultdict(int)
        for l in all_leads:
            src = l.get("source") or "unknown"
            source_counts[src] += 1
        
        source_split = []
        source_colors = {"instagram": "#e1306c", "whatsapp": "#25d366", "facebook": "#1877f2", "website": "#3b82f6", "unknown": "#94a3b8"}
        total_leads_val = len(all_leads)
        
        for k, v in sorted(source_counts.items(), key=lambda x: x[1], reverse=True):
            pct = round((v / total_leads_val * 100), 1) if total_leads_val else 0
            source_split.append({
                "name": k.capitalize(),
                "value": v,
                "percentage": pct,
                "color": source_colors.get(k.lower(), "#64748b")
            })

        # ── 10. Location breakdown ─────────────────────────────────────────────
        location_counts = defaultdict(int)
        for l in all_leads:
            loc = l.get("location") or ""
            if loc.strip():
                location_counts[loc.strip()] += 1
        top_locations = sorted(
            [{"location": k, "count": v} for k, v in location_counts.items()],
            key=lambda x: x["count"], reverse=True
        )[:8]

        # ── 11. Mode breakdown ─────────────────────────────────────────────────
        mode_counts = defaultdict(int)
        for l in all_leads:
            mode = l.get("mode") or "not specified"
            mode_counts[mode] += 1
        mode_breakdown = [{"name": k, "value": v} for k, v in mode_counts.items()]

        # ── 12. Top leads (hot + qualified) ───────────────────────────────────
        top_leads = []
        for l in sorted(all_leads, key=lambda x: (
            x.get("temperature") == "hot",
            x.get("is_qualified"),
            x.get("customer_lead_score", 0) or 0
        ), reverse=True)[:10]:
            top_leads.append({
                "sender_id": l.get("sender_id"),
                "name": l.get("customer_name") or l.get("name") or l.get("instagram_username") or l.get("sender_id"),
                "phone": l.get("phone"),
                "email": l.get("email"),
                "module": l.get("interested_module"),
                "temperature": l.get("temperature"),
                "stage": l.get("lead_stage"),
                "is_qualified": l.get("is_qualified"),
                "updated_at": l.get("updated_at"),
            })

        return {
            "status": "success",
            "window_days": days,
            "generated_at": now.isoformat(),
            "summary": {
                "total_leads": total_leads,
                "window_leads": window_total,
                "hot_leads": hot_leads,
                "warm_leads": warm_leads,
                "cold_leads": cold_leads,
                "qualified": qualified,
                "conversion_rate": conversion_rate,
                "with_phone": with_phone,
                "with_email": with_email,
                "contact_rate": contact_rate,
                "total_conversations": total_convs,
                "ai_replied": ai_replied,
                "needs_human": needs_human,
            },
            "daily_trend": daily_trend,
            "module_breakdown": module_breakdown,
            "temperature_split": temperature_split,
            "stage_funnel": stage_funnel,
            "source_split": source_split,
            "top_locations": top_locations,
            "mode_breakdown": mode_breakdown,
            "top_leads": top_leads,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


# ── GET /reports/export-csv ────────────────────────────────────────────────────

@router.get("/reports/export-csv")
def export_leads_csv():
    """
    Export all leads as a CSV file for download.
    """
    try:
        supabase = _supabase()
        leads_res = supabase.table("leads").select("*").order("updated_at", desc=True).execute()
        leads = leads_res.data or []

        output = io.StringIO()
        if not leads:
            output.write("No data available\n")
        else:
            fieldnames = [
                "sender_id", "customer_name", "name", "instagram_username",
                "phone", "email", "location", "mode",
                "interested_module", "temperature", "lead_stage", "status",
                "is_qualified", "source", "education", "experience",
                "notes", "created_at", "updated_at"
            ]
            writer = csv.DictWriter(output, fieldnames=fieldnames, extrasaction="ignore")
            writer.writeheader()
            for l in leads:
                writer.writerow({k: l.get(k, "") for k in fieldnames})

        output.seek(0)
        filename = f"leads_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        return StreamingResponse(
            iter([output.getvalue()]),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )

    except Exception as e:
        return {"status": "error", "message": str(e)}
