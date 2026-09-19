"""
AuthentiHire - Database DTO & History Schemas
============================================
Pydantic v2 data transfer schemas for paginated analysis history,
snapshots, and deletion acknowledgments.
"""

import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, ConfigDict


class AnalysisSummaryItem(BaseModel):
    """Compact summary schema for analysis history listings."""
    model_config = ConfigDict(from_attributes=True)

    id: str = Field(..., description="Unique analysis record UUID")
    request_id: str = Field(..., description="Request tracking UUID")
    session_id: str = Field(..., description="Anonymous session identifier")
    user_id: Optional[str] = Field(None, description="Owner user UUID if authenticated")
    title: Optional[str] = Field(None, description="Job title")
    company_name: Optional[str] = Field(None, description="Company name")
    location: Optional[str] = Field(None, description="Job location")
    overall_risk_score: int = Field(..., ge=0, le=100, description="Overall risk score (0-100)")
    risk_band: str = Field(..., description="Risk tier: LOW RISK, MODERATE RISK, HIGH RISK, CRITICAL RISK")
    status: str = Field(..., description="Assessment status category")
    fraud_probability: float = Field(..., description="ML fraud probability estimate")
    company_trust_score: int = Field(..., ge=1, le=100, description="Company trust score (1-100)")
    created_at: datetime.datetime = Field(..., description="UTC creation timestamp")


class PaginatedAnalysisHistory(BaseModel):
    """Paginated collection of analysis records scoped to an anonymous session."""
    items: List[AnalysisSummaryItem] = Field(default_factory=list, description="List of analysis summaries")
    total: int = Field(..., ge=0, description="Total number of analyses in this session")
    limit: int = Field(..., ge=1, le=100, description="Page size limit")
    offset: int = Field(..., ge=0, description="Page offset")


class DeleteAnalysisResponse(BaseModel):
    """Confirmation payload returned after deleting an analysis."""
    deleted: bool = Field(True, description="Whether the analysis record was deleted")
    analysis_id: str = Field(..., description="ID of the deleted analysis")
    message: str = Field(..., description="Status message")


class RiskDistribution(BaseModel):
    """Aggregate distribution counts across risk bands."""
    low: int = Field(0, ge=0, description="Count of low risk analyses")
    moderate: int = Field(0, ge=0, description="Count of moderate risk analyses")
    high: int = Field(0, ge=0, description="Count of high risk analyses")
    critical: int = Field(0, ge=0, description="Count of critical risk analyses")


class DashboardSummaryResponse(BaseModel):
    """Aggregated statistics and recent analyses for the authenticated dashboard."""
    total_analyses: int = Field(..., ge=0, description="Total verified analyses by user")
    risk_distribution: RiskDistribution = Field(..., description="Distribution of analyses by risk band")
    average_risk_score: float = Field(..., ge=0.0, le=100.0, description="Mean overall risk score")
    recent_analysis_count: int = Field(..., ge=0, description="Analyses performed in the recent 7-day window")
    recent_analyses: List[AnalysisSummaryItem] = Field(default_factory=list, description="Latest recent analyses for quick access")
