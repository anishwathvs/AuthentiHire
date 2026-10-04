"""
AuthentiHire - FastAPI Backend Application
==========================================
Production-ready REST API exposing endpoints for job posting analysis,
persistence, user authentication, history retrieval, health checks, and model metadata.

Endpoints:
- POST   /api/v1/auth/register         : Register new user account & establish session
- POST   /api/v1/auth/login            : Authenticate user & issue session/token
- POST   /api/v1/auth/logout           : Terminate session & clear cookies
- GET    /api/v1/auth/me               : Retrieve current authenticated user profile
- POST   /api/v1/analyze               : Runs comprehensive risk assessment & persists snapshot
- GET    /api/v1/analyses/{analysis_id}: Retrieves historical analysis snapshot (user or session scoped)
- GET    /api/v1/analyses              : Lists paginated analysis history (user or session scoped)
- DELETE /api/v1/analyses/{analysis_id}: Deletes analysis record owned by current user/session
- GET    /api/v1/health                : Liveness and model loading status check
- GET    /api/v1/model-info            : Non-sensitive model and threshold configuration
"""

import os
import sys
import uuid
import logging
from contextlib import asynccontextmanager
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, Request, Response, Depends, Header, Query, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.orm import Session

# Ensure project root is on sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.api_service import (
    AuthentiHireService,
    JobPostingRequest,
    JobAnalysisResponse,
    HealthResponse,
    ModelInfoResponse,
    API_VERSION,
)
from src.database import (
    get_db,
    init_db,
    User,
    UserRepository,
    AnalysisRepository,
    AnalysisSummaryItem,
    PaginatedAnalysisHistory,
    DeleteAnalysisResponse,
    RiskDistribution,
    DashboardSummaryResponse,
)
from src.auth import (
    RegisterRequest,
    LoginRequest,
    UserResponse,
    AuthResponse,
    LogoutResponse,
    hash_password,
    create_access_token,
    get_current_user,
    get_optional_current_user,
    rate_limit_register,
    rate_limit_login,
    rate_limit_analyze,
    AUTH_ACCESS_TOKEN_EXPIRE_MINUTES,
)

# Configure logging
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("authentihire.api")

# Configure CORS origins
DEFAULT_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
env_origins = os.environ.get("ALLOWED_ORIGINS")
if env_origins:
    raw_origins = [orig.strip() for orig in env_origins.split(",") if orig.strip()]
    if "*" in raw_origins:
        logger.warning("[SECURITY WARNING] Wildcard '*' CORS origin specified with credentials enabled; restricting to default trusted origins.")
        ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS
    else:
        ALLOWED_ORIGINS = raw_origins
else:
    ALLOWED_ORIGINS = DEFAULT_ALLOWED_ORIGINS


# ==============================================================================
# LIFESPAN & APPLICATION SETUP
# ==============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager to warm up model pipeline and initialize persistence on startup."""
    logger.info("=" * 60)
    logger.info("Starting AuthentiHire API Service...")
    logger.info(f"API Version: {API_VERSION} | Log Level: {LOG_LEVEL}")
    logger.info(f"Allowed CORS Origins: {ALLOWED_ORIGINS}")
    
    # Initialize database schema if not already initialized
    try:
        init_db()
        logger.info("[+] Database connection and schema verified.")
    except Exception as e:
        logger.error(f"[!] Database initialization failed: {e}", exc_info=True)
        raise

    # Initialize singleton service & load models once
    try:
        service = AuthentiHireService.get_instance()
        logger.info("[+] ML models, Rule Engine, and Company Intelligence ready.")
    except Exception as e:
        logger.error(f"[!] Critical error initializing models on startup: {e}", exc_info=True)
        raise
    
    logger.info("AuthentiHire API successfully started.")
    logger.info("=" * 60)
    yield
    logger.info("Shutting down AuthentiHire API Service...")


app = FastAPI(
    title="AuthentiHire API",
    description=(
        "Production REST API for automated employment and internship scam detection. "
        "Synthesizes Calibrated Machine Learning, Heuristic Scam Rules, and Company Website Intelligence "
        "with secure user authentication and analysis ownership."
    ),
    version=API_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Register CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


# Security Headers Middleware
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Injects essential defense-in-depth security headers into every HTTP response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "font-src 'self' https://fonts.gstatic.com; "
        "img-src 'self' data: https:; "
        "connect-src 'self'"
    )
    if os.environ.get("ENABLE_HSTS", "false").lower() == "true" or os.environ.get("ENVIRONMENT") == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
    return response


# ==============================================================================
# GLOBAL ERROR HANDLERS (NO STACK TRACE / PATH LEAKAGE)
# ==============================================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Returns structured 422 error for malformed input without leaking stack traces."""
    errors = []
    for err in exc.errors():
        field_path = " -> ".join(str(loc) for loc in err.get("loc", []))
        errors.append({
            "field": field_path,
            "message": err.get("msg", "Invalid value"),
            "type": err.get("type", "validation_error"),
        })

    logger.warning(f"Validation failed on {request.method} {request.url.path}: {errors}")
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "The request body or query parameters failed schema validation.",
                "details": errors,
            }
        },
    )


@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    """Handles explicit HTTP exceptions cleanly."""
    return JSONResponse(
        status_code=exc.status_code,
        headers=exc.headers,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": exc.detail,
            }
        },
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Catches unhandled exceptions, logs internal error, and returns safe 500 response."""
    error_id = str(uuid.uuid4())
    logger.error(f"Unhandled exception [Error ID: {error_id}] on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected internal server error occurred while processing your request.",
                "error_id": error_id,
            }
        },
    )


# ==============================================================================
# AUTHENTICATION ENDPOINTS
# ==============================================================================

def set_auth_cookie(response: Response, token: str) -> None:
    """Sets secure HttpOnly cookie for session token."""
    # max_age in seconds
    max_age = AUTH_ACCESS_TOKEN_EXPIRE_MINUTES * 60
    # In production, secure=True should be used for HTTPS
    is_secure = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    response.set_cookie(
        key="authentihire_token",
        value=token,
        max_age=max_age,
        expires=max_age,
        httponly=True,
        samesite="lax",
        secure=is_secure,
        path="/",
    )


@app.post(
    "/api/v1/auth/register",
    response_model=AuthResponse,
    status_code=status.HTTP_201_CREATED,
    tags=["Authentication"],
    summary="Register a new user account",
    dependencies=[Depends(rate_limit_register)],
)
async def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Registers a new user account with normalized email and Argon2id password hashing."""
    existing = UserRepository.get_by_email(db, payload.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    pwd_hash = hash_password(payload.password)
    user = UserRepository.create_user(db, email=payload.email, password_hash=pwd_hash)
    token = create_access_token(user.id, user.email)
    set_auth_cookie(response, token)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        message="Account successfully created.",
        token=token,
    )


@app.post(
    "/api/v1/auth/login",
    response_model=AuthResponse,
    status_code=status.HTTP_200_OK,
    tags=["Authentication"],
    summary="Authenticate user and obtain session",
    dependencies=[Depends(rate_limit_login)],
)
async def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
) -> AuthResponse:
    """Authenticates a user with constant-time password check and returns a secure session."""
    user = UserRepository.authenticate(db, email=payload.email, plain_password=payload.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = create_access_token(user.id, user.email)
    set_auth_cookie(response, token)

    return AuthResponse(
        user=UserResponse.model_validate(user),
        message="Login successful.",
        token=token,
    )


@app.post(
    "/api/v1/auth/logout",
    response_model=LogoutResponse,
    status_code=status.HTTP_200_OK,
    tags=["Authentication"],
    summary="Log out and invalidate session cookie",
)
async def logout(response: Response) -> LogoutResponse:
    """Clears authentication cookies."""
    response.delete_cookie(key="authentihire_token", path="/")
    response.delete_cookie(key="access_token", path="/")
    return LogoutResponse(message="Successfully logged out.")


@app.get(
    "/api/v1/auth/me",
    response_model=UserResponse,
    status_code=status.HTTP_200_OK,
    tags=["Authentication"],
    summary="Get current authenticated user profile",
)
async def get_me(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Returns safe profile metadata for the authenticated user."""
    return UserResponse.model_validate(current_user)


# ==============================================================================
# ANALYSIS & RISK ENDPOINTS
# ==============================================================================

@app.post(
    "/api/v1/analyze",
    response_model=JobAnalysisResponse,
    status_code=status.HTTP_200_OK,
    dependencies=[Depends(rate_limit_analyze)],
    tags=["Analysis"],
    summary="Analyze and persist a job or internship posting",
    description="Evaluates a job posting across ML classification, deterministic scam rules, and company intelligence, persisting the resulting snapshot under the authenticated user or anonymous session.",
)
async def analyze_job_posting(
    payload: JobPostingRequest,
    live_checks: bool = Query(False, description="Whether to execute external network reachability checks"),
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID", description="Anonymous session identifier header"),
    session_id: Optional[str] = Query(None, description="Optional anonymous session ID query param"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> JobAnalysisResponse:
    """Primary analysis endpoint taking a job posting, running risk assessment, and persisting snapshot."""
    effective_session_id = x_session_id or session_id or str(uuid.uuid4())
    user_id = current_user.id if current_user else None

    try:
        service = AuthentiHireService.get_instance()
        response = service.analyze_job_posting(payload, live_checks=live_checks)
    except Exception as e:
        logger.error(f"Error during job analysis execution: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to complete job posting risk assessment.",
        )

    # Persist analysis in database transaction with user / session ownership
    try:
        saved_record = AnalysisRepository.save_analysis(
            db=db,
            request=payload,
            response=response,
            session_id=effective_session_id,
            user_id=user_id,
        )
        response.analysis_id = str(saved_record.id)
        response.session_id = effective_session_id
        return response
    except Exception as e:
        logger.error(f"Failed to persist analysis snapshot: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist analysis results.",
        )


@app.get(
    "/api/v1/analyses/{analysis_id}",
    response_model=JobAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis Persistence"],
    summary="Retrieve a stored analysis snapshot",
    description="Fetches an immutable historical analysis snapshot by ID, strictly enforcing user or session ownership.",
)
async def get_analysis_by_id(
    analysis_id: str,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> JobAnalysisResponse:
    """Retrieves an existing analysis snapshot with strict ownership checks."""
    effective_session = x_session_id or session_id

    if not current_user and not effective_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user session or authentication token is required to access analysis records.",
        )

    record = AnalysisRepository.get_analysis_by_id(
        db=db,
        analysis_id=analysis_id,
        user_id=current_user.id if current_user else None,
        session_id=effective_session if not current_user else None,
    )

    if record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found.",
        )

    return AnalysisRepository.to_analysis_response(record)


@app.get(
    "/api/v1/dashboard/summary",
    response_model=DashboardSummaryResponse,
    status_code=status.HTTP_200_OK,
    tags=["Dashboard"],
    summary="Get user dashboard verification summary",
    description="Returns aggregate analysis statistics, risk distribution, 7-day volume, and recent analyses strictly scoped to the authenticated user.",
)
async def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DashboardSummaryResponse:
    """Aggregates historical analyses and verification activity for the active user account."""
    summary_data = UserRepository.get_dashboard_summary(db=db, user_id=current_user.id)
    return DashboardSummaryResponse(**summary_data)


@app.get(
    "/api/v1/analyses",
    response_model=PaginatedAnalysisHistory,
    status_code=status.HTTP_200_OK,
    tags=["Analysis Persistence"],
    summary="List analysis history",
    description="Returns a paginated list of historical analyses belonging to the active authenticated user or anonymous session with optional search, risk filtering, and sorting.",
)
async def list_analyses(
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    limit: int = Query(20, ge=1, le=100, description="Page size limit (max 100)"),
    offset: int = Query(0, ge=0, description="Page offset"),
    search: Optional[str] = Query(None, description="Search query across job title, company name, or domain"),
    risk_band: Optional[str] = Query(None, description="Filter by risk band (e.g. LOW, MODERATE, HIGH, CRITICAL)"),
    sort: str = Query("created_at", description="Sort field (created_at, overall_risk_score, company_trust_score, title)"),
    order: str = Query("desc", description="Sort direction (asc, desc)"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> PaginatedAnalysisHistory:
    """Returns paginated analysis history strictly scoped to the active user or session."""
    effective_session = x_session_id or session_id
    if not current_user and not effective_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user session or authentication token is required to view analysis history.",
        )

    records, total = AnalysisRepository.list_analyses(
        db=db,
        user_id=current_user.id if current_user else None,
        session_id=effective_session if not current_user else None,
        limit=limit,
        offset=offset,
        search=search,
        risk_band=risk_band,
        sort=sort,
        order=order,
    )

    summary_items = [AnalysisSummaryItem.model_validate(r) for r in records]
    return PaginatedAnalysisHistory(
        items=summary_items,
        total=total,
        limit=limit,
        offset=offset,
    )


@app.delete(
    "/api/v1/analyses/{analysis_id}",
    response_model=DeleteAnalysisResponse,
    status_code=status.HTTP_200_OK,
    tags=["Analysis Persistence"],
    summary="Delete an analysis record",
    description="Permanently deletes an analysis record owned by the authenticated user or active session.",
)
async def delete_analysis(
    analysis_id: str,
    x_session_id: Optional[str] = Header(None, alias="X-Session-ID"),
    session_id: Optional[str] = Query(None),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: Session = Depends(get_db),
) -> DeleteAnalysisResponse:
    """Deletes an analysis record owned by the user or session."""
    effective_session = x_session_id or session_id
    if not current_user and not effective_session:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user session or authentication token is required to delete an analysis.",
        )

    deleted = AnalysisRepository.delete_analysis(
        db=db,
        analysis_id=analysis_id,
        user_id=current_user.id if current_user else None,
        session_id=effective_session if not current_user else None,
    )

    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analysis record not found.",
        )

    return DeleteAnalysisResponse(
        deleted=True,
        analysis_id=analysis_id,
        message="Analysis successfully deleted.",
    )


# ==============================================================================
# SYSTEM ENDPOINTS
# ==============================================================================

@app.get(
    "/api/v1/health",
    response_model=HealthResponse,
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Health & Readiness check",
    description="Returns service liveness status and verifies model availability in memory.",
)
async def health_check() -> HealthResponse:
    """Lightweight health endpoint without running heavy inference."""
    service = AuthentiHireService.get_instance()
    return service.get_health()


@app.get(
    "/api/v1/model-info",
    response_model=ModelInfoResponse,
    status_code=status.HTTP_200_OK,
    tags=["System"],
    summary="Model and risk scoring metadata",
    description="Returns non-sensitive metadata regarding the active ML model, threshold, risk bands, and scoring weights.",
)
async def model_info() -> ModelInfoResponse:
    """Returns model and configuration descriptors."""
    service = AuthentiHireService.get_instance()
    return service.get_model_info()


# ==============================================================================
# CLI RUNNER
# ==============================================================================

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("API_HOST", "0.0.0.0" if (os.environ.get("PORT") or os.environ.get("ENVIRONMENT") == "production") else "127.0.0.1")
    port = int(os.environ.get("PORT", os.environ.get("API_PORT", "8000")))

    print(f"\nStarting AuthentiHire API server on http://{host}:{port} ...")
    uvicorn.run("src.api:app", host=host, port=port, reload=False)
