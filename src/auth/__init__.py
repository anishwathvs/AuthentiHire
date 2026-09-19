"""
AuthentiHire - Authentication Package
=====================================
"""

from src.auth.security import (
    normalize_email,
    validate_password_policy,
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
    AUTH_SECRET_KEY,
    AUTH_ACCESS_TOKEN_EXPIRE_MINUTES,
)
from src.auth.schemas import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    AuthResponse,
    LogoutResponse,
)
from src.auth.dependencies import (
    get_current_user,
    get_optional_current_user,
    rate_limit_register,
    rate_limit_login,
    rate_limit_analyze,
)
from src.auth.rate_limiter import (
    auth_rate_limiter,
    analysis_rate_limiter,
    InMemoryRateLimiter,
    InMemorySlidingWindowLimiter,
    BaseRateLimiter,
)

__all__ = [
    "normalize_email",
    "validate_password_policy",
    "hash_password",
    "verify_password",
    "create_access_token",
    "decode_access_token",
    "AUTH_SECRET_KEY",
    "AUTH_ACCESS_TOKEN_EXPIRE_MINUTES",
    "RegisterRequest",
    "LoginRequest",
    "UserResponse",
    "AuthResponse",
    "LogoutResponse",
    "get_current_user",
    "get_optional_current_user",
    "rate_limit_register",
    "rate_limit_login",
    "rate_limit_analyze",
    "auth_rate_limiter",
    "analysis_rate_limiter",
    "InMemoryRateLimiter",
    "InMemorySlidingWindowLimiter",
    "BaseRateLimiter",
]
