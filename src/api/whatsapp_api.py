import os
from fastapi import APIRouter, Request, Response, BackgroundTasks
from ..services.webhook_service import process_instagram_webhook
from ..app import VERIFY_TOKEN

router = APIRouter(tags=["WhatsApp Webhook"])

@router.get("/whatsapp/webhook")
async def verify_whatsapp_webhook(request: Request):
    """
    Meta webhook verification for WhatsApp.
    Uses the same VERIFY_TOKEN as Instagram.
    """
    mode = request.query_params.get("hub.mode")
    token = request.query_params.get("hub.verify_token")
    challenge = request.query_params.get("hub.challenge")

    if mode == "subscribe" and token == VERIFY_TOKEN:
        print("WHATSAPP WEBHOOK VERIFIED", flush=True)
        return Response(content=challenge, status_code=200)

    return Response(content="Forbidden", status_code=403)


@router.post("/whatsapp/webhook")
async def receive_whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    """
    Receive WhatsApp messages.
    """
    try:
        body = await request.json()
        
        # Parse WhatsApp Cloud API payload structure
        if body.get("object") == "whatsapp_business_account":
            for entry in body.get("entry", []):
                for change in entry.get("changes", []):
                    value = change.get("value", {})
                    
                    # We only care about incoming messages
                    if "messages" in value:
                        for msg in value["messages"]:
                            sender_id = msg.get("from")
                            
                            # Get text content
                            text = ""
                            if msg.get("type") == "text":
                                text = msg.get("text", {}).get("body", "")
                            elif msg.get("type") == "button":
                                text = msg.get("button", {}).get("text", "")
                            elif msg.get("type") == "interactive":
                                text = msg.get("interactive", {}).get("button_reply", {}).get("title", "")
                                
                            if not text:
                                continue
                                
                            # Get customer name from profile if available
                            customer_name = "Unknown"
                            contacts = value.get("contacts", [])
                            if contacts:
                                customer_name = contacts[0].get("profile", {}).get("name", "Unknown")

                            # To reuse the existing Instagram logic, we construct a fake Instagram payload
                            # and pass it to the same background task, but we tag it with channel
                            # We need to adapt process_instagram_webhook to accept a channel param
                            # For now, we'll just log it
                            print(f"WHATSAPP MSG from {customer_name} ({sender_id}): {text}", flush=True)
                            
                            # We'll adapt the webhook service to handle this
                            background_tasks.add_task(
                                process_whatsapp_message,
                                sender_id=sender_id,
                                text=text,
                                customer_name=customer_name
                            )

        return Response(content="EVENT_RECEIVED", status_code=200)

    except Exception as e:
        print(f"WHATSAPP WEBHOOK ERROR: {e}", flush=True)
        return Response(content="EVENT_RECEIVED", status_code=200)


def process_whatsapp_message(sender_id: str, text: str, customer_name: str):
    """
    Process the incoming WhatsApp message using the existing memory and assistant tools.
    """
    from ..memory import handle_incoming_message, supabase
    from ..assistant import suggest_reply
    from ..services.reply_service import send_reply
    
    print(f"Processing WhatsApp msg from {sender_id}: {text}")
    
    # Ensure customer exists with whatsapp channel
    try:
        existing = supabase.table("customers").select("id").eq("channel_user_id", sender_id).execute()
        if not existing.data:
            supabase.table("customers").insert({
                "channel_user_id": sender_id,
                "name": customer_name,
                "channel": "whatsapp"
            }).execute()
    except Exception as e:
        print(f"Error saving WA customer: {e}")

    # Handle incoming message in memory
    handle_incoming_message(sender_id, text)
    
    # Generate reply
    auto_reply_enabled = os.getenv("AUTO_REPLY", "false").lower() == "true"
    reply_text = suggest_reply(sender_id)
    
    if auto_reply_enabled and reply_text:
        send_reply(
            channel="whatsapp",
            recipient_id=sender_id,
            message=reply_text
        )
        from ..memory import mark_ai_replied
        mark_ai_replied(sender_id, reply_text)
