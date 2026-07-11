import os
import requests
import uuid
from fastapi import APIRouter, Query, Body, UploadFile, File
from pydantic import BaseModel
from typing import Optional, List, Dict
from ..memory import supabase

router = APIRouter(tags=["Social Publisher"])

class PublishRequest(BaseModel):
    text: str
    media_url: Optional[str] = None
    platforms: List[str]  # ["instagram", "facebook", "whatsapp"]
    scheduled_at: Optional[str] = None
    business_id: Optional[str] = None

@router.post("/publisher/post")
def create_social_post(req: PublishRequest):
    """
    Publish or schedule a post to multiple platforms.
    """
    try:
        if not req.text.strip() and not req.media_url:
            return {"status": "error", "message": "Post must contain text or media"}

        if not req.platforms:
            return {"status": "error", "message": "No platforms selected"}

        # 1. Save post to database
        post_data = {
            "text": req.text.strip(),
            "media_url": req.media_url,
            "platforms": req.platforms,
            "scheduled_at": req.scheduled_at,
            "status": "scheduled" if req.scheduled_at else "processing"
        }
        
        if req.business_id:
            post_data["business_id"] = req.business_id
            
        result = supabase.table("social_posts").insert(post_data).execute()
        post_id = result.data[0]["id"] if result.data else None

        if req.scheduled_at:
            return {"status": "success", "message": "Post scheduled", "post_id": post_id}

        # 2. Publish immediately
        results = {}
        
        if "instagram" in req.platforms:
            results["instagram"] = publish_to_instagram(req.text, req.media_url)
            
        if "facebook" in req.platforms:
            results["facebook"] = publish_to_facebook(req.text, req.media_url)
            
        if "whatsapp" in req.platforms:
            results["whatsapp"] = publish_to_whatsapp(req.text, req.media_url)

        # 3. Update status
        has_errors = any(res.get("error") for res in results.values())
        final_status = "failed" if all(res.get("error") for res in results.values()) else ("partial" if has_errors else "published")
        
        if post_id:
            supabase.table("social_posts").update({
                "status": final_status,
                "platform_results": results
            }).eq("id", post_id).execute()

        return {
            "status": "success" if final_status != "failed" else "error",
            "message": f"Post {final_status}",
            "results": results
        }

    except Exception as e:
        print(f"PUBLISHER ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


@router.post("/publisher/upload")
async def upload_media(file: UploadFile = File(...)):
    """
    Upload a media file to Supabase Storage and return its public URL.
    """
    try:
        # 1. Read file
        contents = await file.read()
        
        # 2. Generate unique filename
        ext = os.path.splitext(file.filename)[1].lower() if file.filename else ""
        if not ext and file.content_type:
            if file.content_type.startswith("image/"):
                ext = ".jpg"
            elif file.content_type.startswith("video/"):
                ext = ".mp4"
                
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        
        # 3. Ensure bucket exists (or create it)
        bucket_name = "publisher-media"
        try:
            supabase.storage.get_bucket(bucket_name)
        except Exception:
            try:
                supabase.storage.create_bucket(bucket_name, public=True)
            except Exception as e:
                print(f"Bucket creation info: {e}")
                
        # 4. Upload to Supabase Storage
        # We need to set content-type for proper serving
        res = supabase.storage.from_(bucket_name).upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": file.content_type or "application/octet-stream"}
        )
        
        # 5. Get public URL
        public_url = supabase.storage.from_(bucket_name).get_public_url(unique_filename)
        
        return {
            "status": "success",
            "url": public_url,
            "filename": unique_filename
        }
        
    except Exception as e:
        print(f"UPLOAD ERROR: {e}", flush=True)
        return {"status": "error", "message": str(e)}


@router.get("/publisher/history")
def get_post_history(business_id: Optional[str] = None, limit: int = 50):
    try:
        query = supabase.table("social_posts").select("*").order("created_at", desc=True).limit(limit)
        if business_id:
            query = query.eq("business_id", business_id)
            
        result = query.execute()
        return {"status": "success", "posts": result.data or []}
    except Exception as e:
        return {"status": "error", "message": str(e)}


# --- Platform API implementations ---

def publish_to_instagram(text: str, media_url: Optional[str]) -> dict:
    """
    Publishes to Instagram using Meta Graph API.
    Requires media_url (Instagram API requires media for feed posts).
    """
    token = os.getenv("META_PAGE_ACCESS_TOKEN")
    ig_user_id = os.getenv("INSTAGRAM_ACCOUNT_ID")  # Needs to be the IG User ID, not Page ID
    
    if not token or not ig_user_id:
        return {"error": "Missing META_PAGE_ACCESS_TOKEN or INSTAGRAM_ACCOUNT_ID"}
        
    if not media_url:
        return {"error": "Instagram API requires an image or video URL for feed posts"}

    try:
        # Step 1: Create media container
        container_url = f"https://graph.facebook.com/v23.0/{ig_user_id}/media"
        container_payload = {
            "image_url": media_url,
            "caption": text,
            "access_token": token
        }
        
        # If it's a video, change type
        if media_url.endswith((".mp4", ".mov")):
            container_payload["media_type"] = "VIDEO"
            container_payload["video_url"] = media_url
            del container_payload["image_url"]
            
        c_res = requests.post(container_url, data=container_payload).json()
        
        if "error" in c_res:
            return {"error": c_res["error"].get("message", "Container creation failed")}
            
        creation_id = c_res.get("id")
        
        # Step 2: Publish container
        publish_url = f"https://graph.facebook.com/v23.0/{ig_user_id}/media_publish"
        p_res = requests.post(publish_url, data={
            "creation_id": creation_id,
            "access_token": token
        }).json()
        
        if "error" in p_res:
            return {"error": p_res["error"].get("message", "Publish failed")}
            
        return {"success": True, "id": p_res.get("id")}
        
    except Exception as e:
        return {"error": str(e)}


def publish_to_facebook(text: str, media_url: Optional[str]) -> dict:
    """
    Publishes to Facebook Page using Meta Graph API.
    """
    token = os.getenv("META_PAGE_ACCESS_TOKEN")
    page_id = os.getenv("FACEBOOK_PAGE_ID") or "me"
    
    if not token:
        return {"error": "Missing META_PAGE_ACCESS_TOKEN"}

    try:
        # If media exists, post as photo/video
        if media_url:
            if media_url.endswith((".mp4", ".mov")):
                url = f"https://graph.facebook.com/v23.0/{page_id}/videos"
                payload = {"file_url": media_url, "description": text, "access_token": token}
            else:
                url = f"https://graph.facebook.com/v23.0/{page_id}/photos"
                payload = {"url": media_url, "caption": text, "access_token": token}
        else:
            # Text only post
            url = f"https://graph.facebook.com/v23.0/{page_id}/feed"
            payload = {"message": text, "access_token": token}
            
        res = requests.post(url, data=payload).json()
        
        if "error" in res:
            return {"error": res["error"].get("message", "Facebook publish failed")}
            
        return {"success": True, "id": res.get("id")}
        
    except Exception as e:
        return {"error": str(e)}


def publish_to_whatsapp(text: str, media_url: Optional[str]) -> dict:
    """
    Broadcasts to WhatsApp opted-in list.
    """
    token = os.getenv("META_PAGE_ACCESS_TOKEN") or os.getenv("WHATSAPP_ACCESS_TOKEN")
    phone_id = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
    
    if not token or not phone_id:
        return {"error": "Missing WHATSAPP token or phone ID"}
        
    return {"error": "WhatsApp broadcast requires template approval first. Please set up templates in Meta Business Manager."}
