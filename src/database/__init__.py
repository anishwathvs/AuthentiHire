"""
AuthentiHire - Database Package
===============================
Persistence layer integrating SQLAlchemy 2.x ORM models, session management,
and repository data access patterns.
"""

from src.database.connection import engine, SessionLocal, get_db, init_db, drop_db, DATABASE_URL
from src.database.models import Base, User, Analysis, AnalysisEvidence, CompanyVerification
from src.database.schemas import AnalysisSummaryItem, PaginatedAnalysisHistory, DeleteAnalysisResponse, RiskDistribution, DashboardSummaryResponse
from src.database.repository import AnalysisRepository, UserRepository

__all__ = [
    "engine",
    "SessionLocal",
    "get_db",
    "init_db",
    "drop_db",
    "DATABASE_URL",
    "Base",
    "User",
    "Analysis",
    "AnalysisEvidence",
    "CompanyVerification",
    "AnalysisSummaryItem",
    "PaginatedAnalysisHistory",
    "DeleteAnalysisResponse",
    "RiskDistribution",
    "DashboardSummaryResponse",
    "AnalysisRepository",
    "UserRepository",
]
