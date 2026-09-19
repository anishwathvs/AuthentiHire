"""
AuthentiHire - Authentication & Security Module
================================================
Implements Argon2id password hashing, multi-scheme verification (Argon2id + bcrypt fallback),
email normalization, strict password policy verification, and signed JWT access tokens.
"""

import os
import re
import datetime
from typing import Optional, Dict, Any, Tuple
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import Argon2Error, VerifyMismatchError, VerificationError, InvalidHash
import bcrypt

# Configuration & Secrets
AUTH_SECRET_KEY = os.environ.get(
    "AUTH_SECRET_KEY",
    "authentihire-dev-secret-key-do-not-use-in-production-change-me"
)
JWT_ALGORITHM = "HS256"
AUTH_ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("AUTH_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))  # 24 hours default

# Initialize Argon2id password hasher with secure modern parameters
# Argon2id is the OWASP-recommended algorithm for password hashing
password_hasher = PasswordHasher(
    time_cost=2,
    memory_cost=65536,  # 64 MB
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


def normalize_email(email: str) -> str:
    """
    Normalizes an email address deterministically:
    - Strips surrounding whitespace
    - Lowercases the domain and local part
    - Validates basic RFC format
    """
    if not email or not isinstance(email, str):
        raise ValueError("Email address cannot be empty.")
    
    cleaned = email.strip().lower()
    if not EMAIL_REGEX.match(cleaned):
        raise ValueError("Invalid email address format.")
    
    return cleaned


def validate_password_policy(password: str) -> Tuple[bool, Optional[str]]:
    """
    Validates password against user-friendly security policy:
    - Minimum length: 8 characters
    - Maximum length: 128 characters (mitigates DoS on hashing)
    - Cannot be purely whitespace
    """
    if not password or not isinstance(password, str):
        return False, "Password cannot be empty."
    
    if len(password.strip()) == 0:
        return False, "Password cannot consist solely of whitespace."
    
    if len(password) < 8:
        return False, "Password must be at least 8 characters in length."
    
    if len(password) > 128:
        return False, "Password must not exceed 128 characters."
    
    return True, None


def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using Argon2id with unique cryptographic salt.
    """
    valid, msg = validate_password_policy(password)
    if not valid:
        raise ValueError(msg)
    
    return password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against a stored hash string.
    Supports Argon2id natively and bcrypt hashes for migration compatibility.
    """
    if not plain_password or not hashed_password:
        return False
    
    # Check if hash is bcrypt ($2a$, $2b$, $2y$)
    if hashed_password.startswith(("$2a$", "$2b$", "$2y$")):
        try:
            return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
        except Exception:
            return False
    
    # Default: Argon2id verification
    try:
        return password_hasher.verify(hashed_password, plain_password)
    except (Argon2Error, VerifyMismatchError, VerificationError, InvalidHash):
        return False
    except Exception:
        return False


def create_access_token(
    user_id: str,
    email: str,
    expires_delta: Optional[datetime.timedelta] = None,
) -> str:
    """
    Creates a signed JWT access token containing standard claims:
    - sub: user UUID
    - email: user normalized email
    - iat: issued at timestamp
    - exp: expiration timestamp
    - type: access
    """
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=AUTH_ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload: Dict[str, Any] = {
        "sub": str(user_id),
        "email": str(email),
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
        "type": "access",
    }
    
    return jwt.encode(payload, AUTH_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """
    Decodes and cryptographically verifies an access token.
    Raises jwt.PyJWTError on signature failure, expiration, or malformed claims.
    """
    payload = jwt.decode(
        token,
        AUTH_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
        options={"require": ["sub", "exp", "iat"]},
    )
    return payload
