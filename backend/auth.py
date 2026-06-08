"""
Authentication: JWT tokens, password hashing, current user dependency.
"""
import os
import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
import bcrypt
from sqlalchemy.orm import Session

from database import get_db, User

# ── CONFIG ──────────────────────────────────────────────
SECRET_KEY  = os.getenv("SECRET_KEY", "change-this-in-production-please")
ALGORITHM   = "HS256"
TOKEN_EXPIRE_HOURS = 72

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# ── PASSWORD ────────────────────────────────────────────

def hash_password(password: str) -> str:
    passwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(passwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain: str, hashed: str) -> bool:
    try:
        if hashed.startswith("$2a$") or hashed.startswith("$2b$") or hashed.startswith("$2y$"):
            return bcrypt.checkpw(plain.encode('utf-8'), hashed.encode('utf-8'))
        return plain == hashed
    except Exception:
        return plain == hashed


# ── JWT ─────────────────────────────────────────────────

def create_token(user_id: str, role: str, client_id: Optional[str] = None, expires_delta: Optional[timedelta] = None) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15) # Short-lived access token
    payload = {
        "sub": user_id,
        "role": role,
        "client_id": client_id,
        "exp": expire,
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")


# ── UNIFIED IDENTITY ────────────────────────────────────

class AuthIdentity:
    def __init__(self, id: str, email: str, name: str, role: str, client_id: Optional[str], is_active: bool):
        self.id = id
        self.email = email
        self.name = name
        self.role = role
        self.client_id = client_id
        self.is_active = is_active


# ── DEPENDENCIES ────────────────────────────────────────

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> AuthIdentity:
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token payload.")

    # Check Admin/Standard User table first
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        if not user.is_active:
            raise HTTPException(status_code=401, detail="User account is deactivated.")
        return AuthIdentity(
            id=user.id,
            email=user.username or user.email,
            name=user.name,
            role=user.role,
            client_id=user.client_id,
            is_active=user.is_active
        )

    # Check ClientAccess table (Dynamic Imports to avoid circular imports)
    from database import ClientAccess, Client
    client_acc = db.query(ClientAccess).filter(ClientAccess.id == user_id).first()
    if client_acc:
        if not client_acc.is_active:
            raise HTTPException(status_code=401, detail="Client access is revoked.")
        
        # Get actual client name
        client = db.query(Client).filter(Client.id == client_acc.client_id).first()
        client_name = client.name if client else "Client Access"

        return AuthIdentity(
            id=client_acc.id,
            email=client_acc.username,
            name=client_name,
            role="client", # Assign client scope
            client_id=client_acc.client_id,
            is_active=client_acc.is_active
        )

    raise HTTPException(status_code=401, detail="Identity not found or unauthorized.")

def require_admin(current_user: AuthIdentity = Depends(get_current_user)) -> AuthIdentity:
    # Allow any internal team role (super_admin, csm, hr, employee) to access admin routes.
    # Stricter checks (like edit/delete) are enforced inside specific route handlers.
    from services.permissions import is_internal
    if not is_internal(current_user.role):
        raise HTTPException(status_code=403, detail="Admin dashboard access required.")
    return current_user

def require_client(current_user: AuthIdentity = Depends(get_current_user)) -> AuthIdentity:
    # All authenticated users (including brand_voyager) are allowed, but brand_voyager is strictly bound to their client_id
    # The actual cross-tenant checking MUST happen inside the route
    return current_user

