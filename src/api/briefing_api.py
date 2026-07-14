from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from typing import Optional
import os
from ..memory import supabase
from .overview_api import overview
from .notifications_api import get_notifications
from openai import OpenAI
from ..services.reply_service import send_reply

router = APIRouter(prefix="/briefing", tags=["Briefing"])

def generate_ai_summary(data: dict):
    """Generate a concise AI summary using the built-in LLM."""
    client = OpenAI()
    
    stats = data.get("stat_cards", {})
    recent_leads = data.get("recent_leads", [])
    notifications = data.get("notifications", [])
    
    prompt = f"""
    You are the AI Assistant for Mohamed Aslam (The SAP Guru). 
    Generate a professional, motivating morning briefing for today, {datetime.now().strftime('%B %d, %Y')}.
    
    Key Stats:
    - Total Leads: {stats.get('total_leads')}
    - New Leads Today: {stats.get('new_leads_today')}
    - Hot Leads: {stats.get('hot_leads')}
    - Needs Human Review: {stats.get('needs_human')}
    
    Recent Activity:
    {[{'name': l['name'], 'temp': l['temperature']} for l in recent_leads[:3]]}
    
    Pending Alerts:
    {[n['title'] + ': ' + n['message'] for n in notifications[:3]]}
    
    Requirements:
    1. Start with a brief, energetic greeting.
    2. Summarize the state of the business in 2-3 sentences.
    3. List the top 3 priorities for today based on 'Needs Human' and 'Hot Leads'.
    4. Keep it under 150 words.
    5. Use a professional yet supportive tone.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"LLM Error: {e}")
        return "Good morning! Here's a quick update: You have new leads and some conversations waiting for your review. Let's make it a great day!"

@router.post("/generate")
async def generate_daily_briefing():
    """Generate and save the daily briefing."""
    try:
        # 1. Get current data
        ov_data = overview()
        notif_data = await get_notifications()
        
        combined_data = {
            "stat_cards": ov_data.get("stat_cards"),
            "recent_leads": ov_data.get("recent_leads"),
            "notifications": notif_data.get("notifications")
        }
        
        # 2. Generate AI summary
        summary = generate_ai_summary(combined_data)
        
        # 3. Save to Supabase
        briefing_entry = {
            "summary": summary,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "data_snapshot": combined_data
        }
        
        res = supabase.table("briefings").insert(briefing_entry).execute()

        # Attempt to send briefing via WhatsApp
        # For now, we'll use a placeholder recipient. In a real scenario, this would be configured per business/user.
        # The business_id is available from the overview() call, which can be used to fetch the admin's WhatsApp number.
        admin_whatsapp_number = os.getenv("ADMIN_WHATSAPP_NUMBER") # This needs to be set in environment variables
        if admin_whatsapp_number:
            try:
                send_reply(
                    channel="whatsapp",
                    recipient_id=admin_whatsapp_number,
                    message=f"Good morning, Mohamed!\n\n{summary}"
                )
                print(f"Daily briefing sent to {admin_whatsapp_number} via WhatsApp.")
            except Exception as whatsapp_e:
                print(f"Failed to send WhatsApp briefing: {whatsapp_e}")
        else:
            print("ADMIN_WHATSAPP_NUMBER not set, skipping WhatsApp delivery.")
        
        return {"status": "success", "briefing": res.data[0] if res.data else None}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/latest")
async def get_latest_briefing():
    """Get the most recent daily briefing."""
    try:
        res = supabase.table("briefings").select("*").order("created_at", desc=True).limit(1).execute()
        if not res.data:
            return {"status": "no_briefing", "message": "No briefing generated yet today."}
        return {"status": "success", "briefing": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
