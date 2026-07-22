import requests
import json
from datetime import datetime
from .follower_dm_service import _supabase, _get_token, handle_new_follower

def get_all_instagram_businesses():
    """Get all connected Instagram businesses."""
    sb = _supabase()
    res = sb.table("business_integrations").select("business_id, credentials").eq("provider", "instagram").eq("is_connected", True).execute()
    return res.data or []

def fetch_instagram_followers(ig_account_id: str, token: str) -> list:
    """Fetch followers list from Instagram Graph API."""
    try:
        url = f"https://graph.facebook.com/v23.0/{ig_account_id}/followers"
        params = {"access_token": token, "limit": 100}
        followers = []
        
        while url:
            r = requests.get(url, params=params, timeout=10)
            if r.status_code == 200:
                data = r.json()
                followers.extend(data.get("data", []))
                # Pagination
                paging = data.get("paging", {})
                url = paging.get("next")
                params = {} # params are included in the next URL
            else:
                print(f"POLLING: Error fetching followers: {r.text}", flush=True)
                break
        return followers
    except Exception as e:
        print(f"POLLING: Exception fetching followers: {e}", flush=True)
        return []

async def poll_new_followers():
    """Poll for new followers across all connected Instagram businesses."""
    print("POLLING: Starting follower poll job...", flush=True)
    businesses = get_all_instagram_businesses()
    sb = _supabase()
    
    new_followers_count = 0
    for biz in businesses:
        business_id = biz["business_id"]
        creds = biz.get("credentials") or {}
        ig_account_id = creds.get("instagram_account_id")
        
        if not ig_account_id:
            continue
            
        token = _get_token(business_id)
        if not token:
            continue
            
        # 1. Fetch current followers from API
        current_followers = fetch_instagram_followers(ig_account_id, token)
        if not current_followers:
            continue
            
        current_follower_ids = {str(f.get("id")) for f in current_followers if f.get("id")}
        
        # 2. Get known followers from our database
        # We store them in a new table 'instagram_followers' to track them
        # Check if table exists, if not we create a tracked list
        res = sb.table("instagram_followers").select("follower_id").eq("business_id", business_id).execute()
        known_follower_ids = {str(row["follower_id"]) for row in (res.data or [])}
        
        # 3. Find new followers
        # If known_follower_ids is empty, this is the first run. 
        # We shouldn't DM everyone on the first run, just save them.
        is_first_run = len(known_follower_ids) == 0
        
        new_ids = current_follower_ids - known_follower_ids
        
        if new_ids:
            print(f"POLLING: Found {len(new_ids)} new followers for business {business_id}", flush=True)
            
            # Save them all
            inserts = []
            for fid in new_ids:
                inserts.append({
                    "business_id": business_id,
                    "follower_id": fid,
                    "created_at": datetime.utcnow().isoformat()
                })
            
            # Batch insert
            for i in range(0, len(inserts), 100):
                sb.table("instagram_followers").insert(inserts[i:i+100]).execute()
            
            # If not first run, trigger the DM flow
            if not is_first_run:
                for fid in new_ids:
                    print(f"POLLING: Triggering welcome DM for new follower {fid}", flush=True)
                    await handle_new_follower(sender_id=fid, business_id=business_id)
                    new_followers_count += 1
        else:
            print(f"POLLING: No new followers for business {business_id}", flush=True)
            
    print(f"POLLING: Job complete. Triggered {new_followers_count} welcome DMs.", flush=True)
    return {"status": "success", "new_followers_found": new_followers_count}
