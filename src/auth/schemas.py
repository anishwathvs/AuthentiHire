"""
AuthentiHire - Authentication Request and Response Schemas
==========================================================
Pydantic v2 data models for user registration, login, profile, and session management.
"""

import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator, ConfigDict


class RegisterRequest(BaseModel):
    """Schema for user account registration."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 chars)")

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, v: str) -> str:
        from src.auth.security import normalize_email
        return normalize_email(v)

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        from src.auth.security import validate_password_policy
        valid, msg = validate_password_policy(v)
        if not valid:
            raise ValueError(msg)
        return v


class LoginRequest(BaseModel):
    """Schema for user authentication."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")

    @field_validator("email")
    @classmethod
    def validate_and_normalize_email(cls, v: str) -> str:
        from src.auth.security import normalize_email
        return normalize_email(v)


class UserResponse(BaseModel):
    """Safe user profile response containing no sensitive authentication data."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="User UUID primary identifier")
    email: str = Field(..., description="Normalized user email address")
    created_at: datetime.datetime = Field(..., description="UTC registration timestamp")
    is_active: bool = Field(True, description="Account active status")


class AuthResponse(BaseModel):
    """Response returned upon successful registration or login."""
    user: UserResponse = Field(..., description="User account profile")
    message: str = Field("Authentication successful.", description="Status message")
    token: Optional[str] = Field(None, description="Optional bearer token for API clients")


class LogoutResponse(BaseModel):
    """Confirmation payload returned upon session termination."""
    message: str = Field("Successfully logged out.", description="Status message")
