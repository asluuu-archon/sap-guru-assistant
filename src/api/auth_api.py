"""
Authentication API
Handles user registration, login, JWT token generation, and user-business association.
Each user can own or belong to one or more businesses.
"""

from fastapi import APIRouter, HTTPException, Header, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from typing import Optional
import hashlib
import hmac
import base64
import json
import os
import time
from datetime import datetime, timedelta

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer(auto_error=False)

# JWT secret — falls back to env var, then a hardcoded dev secret
JWT_SECRET = os.environ.get("JWT_SECRET", "sap-guru-ai-command-center-jwt-secret-2024")
JWT_EXPIRY_HOURS = 24 * 7  # 7 days


def _supabase():
    from src.memory import supabase
    return supabase


# ─── JWT Helpers ────────────────────────────────────────────────────────────

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = 4 - len(s) % 4
    if padding != 4:
        s += "=" * padding
    return base64.urlsafe_b64decode(s)


def create_jwt(payload: dict) -> str:
    header = _b64url_encode(json.dumps({"alg": "HS256", "typ": "JWT"}).encode())
    payload["exp"] = int(time.time()) + JWT_EXPIRY_HOURS * 3600
    body = _b64url_encode(json.dumps(payload).encode())
    sig_input = f"{header}.{body}".encode()
    sig = hmac.new(JWT_SECRET.encode(), sig_input, hashlib.sha256).digest()
    return f"{header}.{body}.{_b64url_encode(sig)}"


def verify_jwt(token: str) -> Optional[dict]:
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header, body, sig = parts
        sig_input = f"{header}.{body}".encode()
        expected_sig = hmac.new(JWT_SECRET.encode(), sig_input, hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_encode(expected_sig), sig):
            return None
        payload = json.loads(_b64url_decode(body))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except Exception:
        return None


def hash_password(password: str) -> str:
    salt = os.environ.get("PASSWORD_SALT", "sap-guru-salt-2024")
    return hashlib.sha256(f"{salt}{password}".encode()).hexdigest()


# ─── Dependency: get current user from JWT ───────────────────────────────────

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[dict]:
    if not credentials:
        return None
    return verify_jwt(credentials.credentials)


def require_auth(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> dict:
    user = get_current_user(credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user


# ─── Request Models ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    business_name: Optional[str] = None
    industry: Optional[str] = "Education / Training"


class LoginRequest(BaseModel):
    email: str
    password: str


class InviteUserRequest(BaseModel):
    email: str
    role: str = "agent"  # 'admin' | 'agent'
    business_id: str


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/register")
async def register(data: RegisterRequest):
    """Register a new user and optionally create their first business."""
    supabase = _supabase()

    # Check if email already exists
    try:
        existing = supabase.table("users").select("id").eq("email", data.email.lower().strip()).execute()
        if existing.data:
            raise HTTPException(status_code=400, detail="Email already registered")
    except HTTPException:
        raise
    except Exception:
        pass  # Table might not exist yet

    hashed_pw = hash_password(data.password)
    user_id = None

    try:
        # Create user
        user_res = supabase.table("users").insert({
            "name": data.name.strip(),
            "email": data.email.lower().strip(),
            "password_hash": hashed_pw,
            "role": "admin",
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        user_id = user_res.data[0]["id"] if user_res.data else None
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create user: {str(e)}")

    business_id = None

    # Create first business if business_name provided
    if data.business_name and user_id:
        try:
            biz_res = supabase.table("businesses").insert({
                "name": data.business_name.strip(),
                "industry": data.industry or "Education / Training",
                "owner_user_id": user_id,
                "status": "active",
                "created_at": datetime.utcnow().isoformat()
            }).execute()
            business_id = biz_res.data[0]["id"] if biz_res.data else None

            # Link user to business
            if business_id:
                supabase.table("user_businesses").insert({
                    "user_id": user_id,
                    "business_id": business_id,
                    "role": "admin"
                }).execute()

                # Create default business_profile row
                supabase.table("business_profile").insert({
                    "business_id": business_id,
                    "business_name": data.business_name.strip(),
                    "industry": data.industry or "Education / Training",
                    "ai_enabled": True,
                    "auto_reply_enabled": True,
                    "ai_tone": "Professional & Helpful",
                    "reply_delay_minutes": 2,
                }).execute()

        except Exception:
            pass  # Business creation is optional, don't fail registration

    token = create_jwt({
        "user_id": user_id,
        "email": data.email.lower().strip(),
        "name": data.name.strip(),
        "role": "admin",
        "business_id": business_id,
    })

    return {
        "status": "success",
        "token": token,
        "user": {
            "id": user_id,
            "name": data.name.strip(),
            "email": data.email.lower().strip(),
            "role": "admin",
        },
        "business_id": business_id,
        "message": "Registration successful"
    }


@router.post("/login")
async def login(data: LoginRequest):
    """Login with email and password. Returns JWT token."""
    supabase = _supabase()

    hashed_pw = hash_password(data.password)

    try:
        user_res = supabase.table("users") \
            .select("*") \
            .eq("email", data.email.lower().strip()) \
            .eq("password_hash", hashed_pw) \
            .execute()

        if not user_res.data:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user = user_res.data[0]
        user_id = user["id"]

        # Get user's businesses
        biz_res = supabase.table("user_businesses") \
            .select("business_id, role, businesses(id, name, industry, status)") \
            .eq("user_id", user_id) \
            .execute()

        businesses = []
        for row in (biz_res.data or []):
            biz = row.get("businesses") or {}
            if isinstance(biz, list):
                biz = biz[0] if biz else {}
            businesses.append({
                "id": row.get("business_id"),
                "name": biz.get("name", ""),
                "industry": biz.get("industry", ""),
                "status": biz.get("status", "active"),
                "role": row.get("role", "agent"),
            })

        # Default to first business
        default_business_id = businesses[0]["id"] if businesses else None

        token = create_jwt({
            "user_id": user_id,
            "email": user["email"],
            "name": user.get("name", ""),
            "role": user.get("role", "agent"),
            "business_id": default_business_id,
        })

        # Update last login
        try:
            supabase.table("users").update({"last_login": datetime.utcnow().isoformat()}).eq("id", user_id).execute()
        except Exception:
            pass

        return {
            "status": "success",
            "token": token,
            "user": {
                "id": user_id,
                "name": user.get("name", ""),
                "email": user["email"],
                "role": user.get("role", "agent"),
            },
            "businesses": businesses,
            "active_business_id": default_business_id,
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/me")
async def get_me(user: dict = Depends(require_auth)):
    """Get current user info and their businesses."""
    supabase = _supabase()

    try:
        biz_res = supabase.table("user_businesses") \
            .select("business_id, role, businesses(id, name, industry, status)") \
            .eq("user_id", user["user_id"]) \
            .execute()

        businesses = []
        for row in (biz_res.data or []):
            biz = row.get("businesses") or {}
            if isinstance(biz, list):
                biz = biz[0] if biz else {}
            businesses.append({
                "id": row.get("business_id"),
                "name": biz.get("name", ""),
                "industry": biz.get("industry", ""),
                "status": biz.get("status", "active"),
                "role": row.get("role", "agent"),
            })

        return {
            "status": "success",
            "user": {
                "id": user["user_id"],
                "name": user.get("name", ""),
                "email": user.get("email", ""),
                "role": user.get("role", "agent"),
            },
            "businesses": businesses,
            "active_business_id": user.get("business_id"),
        }
    except Exception as e:
        return {
            "status": "success",
            "user": user,
            "businesses": [],
            "active_business_id": user.get("business_id"),
        }


@router.post("/switch-business")
async def switch_business(business_id: str, user: dict = Depends(require_auth)):
    """Generate a new token with a different active business_id."""
    supabase = _supabase()

    # Verify user has access to this business
    try:
        access = supabase.table("user_businesses") \
            .select("role") \
            .eq("user_id", user["user_id"]) \
            .eq("business_id", business_id) \
            .execute()
        if not access.data:
            raise HTTPException(status_code=403, detail="You do not have access to this business")
        role = access.data[0].get("role", "agent")
    except HTTPException:
        raise
    except Exception:
        role = user.get("role", "agent")

    new_token = create_jwt({
        "user_id": user["user_id"],
        "email": user.get("email", ""),
        "name": user.get("name", ""),
        "role": role,
        "business_id": business_id,
    })

    return {
        "status": "success",
        "token": new_token,
        "active_business_id": business_id,
    }


@router.post("/change-password")
async def change_password(old_password: str, new_password: str, user: dict = Depends(require_auth)):
    """Change the current user's password."""
    supabase = _supabase()

    old_hash = hash_password(old_password)
    try:
        check = supabase.table("users") \
            .select("id") \
            .eq("id", user["user_id"]) \
            .eq("password_hash", old_hash) \
            .execute()
        if not check.data:
            raise HTTPException(status_code=401, detail="Current password is incorrect")

        new_hash = hash_password(new_password)
        supabase.table("users").update({"password_hash": new_hash}).eq("id", user["user_id"]).execute()
        return {"status": "success", "message": "Password changed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
