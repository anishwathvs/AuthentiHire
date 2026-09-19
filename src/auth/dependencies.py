"""
AuthentiHire - Authentication Dependencies
==========================================
FastAPI dependencies for JWT authentication, active user retrieval,
optional user resolution, and rate limiting enforcement.
"""

from typing import Optional
from fastapi import Depends, HTTPException, Request, status, Cookie, Header
from sqlalchemy.orm import Session
import jwt

import os
from src.database.connection import get_db
from src.database.models import User
from src.auth.security import decode_access_token
from src.auth.rate_limiter import auth_rate_limiter, analysis_rate_limiter


def extract_token_from_request(
    request: Request,
    authentihire_token: Optional[str] = None,
    access_token: Optional[str] = None,
    authorization: Optional[str] = None,
) -> Optional[str]:
    """
    Extracts access token from Authorization: Bearer header or HttpOnly cookies.
    Priority:
    1. Authorization: Bearer header (explicit request credential)
    2. authentihire_token cookie (browser session)
    3. access_token cookie
    4. request.cookies fallback
    """
    if authorization and authorization.lower().startswith("bearer "):
        return authorization.split(" ", 1)[1].strip()
    if authentihire_token:
        return authentihire_token
    if access_token:
        return access_token
    if request and hasattr(request, "cookies"):
        if request.cookies.get("authentihire_token"):
            return request.cookies.get("authentihire_token")
        if request.cookies.get("access_token"):
            return request.cookies.get("access_token")
    return None


def get_current_user(
    request: Request,
    authentihire_token: Optional[str] = Cookie(None),
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    """
    Strict authentication dependency.
    Raises HTTP 401 if token is absent, invalid, expired, or user is inactive.
    """
    token = extract_token_from_request(request, authentihire_token, access_token, authorization)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token claims.",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication session expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate authentication credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    return user


def get_optional_current_user(
    request: Request,
    authentihire_token: Optional[str] = Cookie(None),
    access_token: Optional[str] = Cookie(None),
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> Optional[User]:
    """
    Permissive authentication dependency for hybrid endpoints.
    Returns User if valid token is provided, otherwise None without raising 401.
    """
    token = extract_token_from_request(request, authentihire_token, access_token, authorization)
    if not token:
        return None

    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if not user_id:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.is_active:
            return user
        return None
    except Exception:
        return None


def rate_limit_register(request: Request) -> None:
    """Enforces registration abuse rate limiting per client IP."""
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = auth_rate_limiter.is_allowed(
        identifier=client_ip,
        action="register",
        max_requests=10,
        window_seconds=60,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many registration requests. Please retry in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )


def rate_limit_login(request: Request) -> None:
    """Enforces login brute-force throttling per client IP."""
    client_ip = request.client.host if request.client else "unknown"
    allowed, retry_after = auth_rate_limiter.is_allowed(
        identifier=client_ip,
        action="login",
        max_requests=15,
        window_seconds=60,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Too many login attempts. Please retry in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )


def rate_limit_analyze(request: Request) -> None:
    """Enforces analysis rate limiting per client IP to prevent compute exhaustion."""
    client_ip = request.client.host if request.client else "unknown"
    max_requests = int(os.environ.get("RATE_LIMIT_ANALYZE_MAX_REQUESTS", "60"))
    allowed, retry_after = analysis_rate_limiter.is_allowed(
        identifier=client_ip,
        action="analyze",
        max_requests=max_requests,
        window_seconds=60,
    )
    if not allowed:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Analysis rate limit exceeded. Please retry in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )
