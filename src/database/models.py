"""
AuthentiHire - Database ORM Models
==================================
SQLAlchemy 2.x declarative data models for job posting analyses,
heuristic rule evidence, and company website intelligence persistence.
"""

import datetime
from typing import List, Optional
from sqlalchemy import (
    Column,
    String,
    Integer,
    Float,
    Boolean,
    Text,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


class User(Base):
    """User account entity representing a registered AuthentiHire member."""

    __tablename__ = "users"

    id = Column(String(36), primary_key=True, index=True, doc="UUID primary key for user account")
    email = Column(String(255), unique=True, index=True, nullable=False, doc="Normalized, unique email address")
    password_hash = Column(String(255), nullable=False, doc="Argon2id cryptographic password hash")
    is_active = Column(Boolean, default=True, nullable=False, doc="Active account status flag")
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        index=True,
        doc="UTC timestamp of account creation",
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        doc="UTC timestamp of last profile update",
    )

    # Relationships (One-to-many cascading delete to analyses)
    analyses = relationship(
        "Analysis",
        back_populates="user",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<User(id='{self.id}', email='{self.email}', is_active={self.is_active})>"


class Analysis(Base):
    """Primary analysis record representing an immutable risk assessment snapshot."""

    __tablename__ = "analyses"

    # Primary Identifiers & Ownership
    id = Column(String(36), primary_key=True, index=True, doc="UUID primary key for analysis record")
    request_id = Column(String(36), index=True, nullable=False, doc="API request tracking UUID")
    session_id = Column(String(64), index=True, nullable=False, doc="Anonymous session identifier for ownership")
    user_id = Column(
        String(36),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=True,
        index=True,
        doc="Optional foreign key linking analysis to registered user account",
    )
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        index=True,
        doc="UTC timestamp of analysis creation",
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.datetime.now(datetime.timezone.utc),
        onupdate=lambda: datetime.datetime.now(datetime.timezone.utc),
        nullable=False,
        doc="UTC timestamp of last update",
    )

    # Stored Job Posting Details (Data minimization for snapshot reproduction)
    title = Column(String(255), nullable=True, doc="Job title")
    company_name = Column(String(255), nullable=True, doc="Employer/Company name")
    location = Column(String(255), nullable=True, doc="Job location")
    department = Column(String(255), nullable=True, doc="Department name")
    salary_range = Column(String(100), nullable=True, doc="Salary compensation range")
    employment_type = Column(String(100), nullable=True, doc="Full-time, Part-time, etc.")
    required_experience = Column(String(100), nullable=True, doc="Experience requirement")
    required_education = Column(String(100), nullable=True, doc="Education requirement")
    industry = Column(String(100), nullable=True, doc="Industry category")
    function = Column(String(100), nullable=True, doc="Job function")
    telecommuting = Column(Boolean, default=False, nullable=False, doc="Remote work flag")
    has_company_logo = Column(Boolean, default=False, nullable=False, doc="Company logo presence")
    has_questions = Column(Boolean, default=False, nullable=False, doc="Screening questions flag")
    recruiter_email = Column(String(255), nullable=True, doc="Recruiter contact email")
    url = Column(String(1024), nullable=True, doc="Company website or posting URL")
    company_profile = Column(Text, nullable=True, doc="Company profile text")
    description = Column(Text, nullable=True, doc="Job description text")
    requirements = Column(Text, nullable=True, doc="Job qualifications and requirements")
    benefits = Column(Text, nullable=True, doc="Compensation benefits")

    # ML Assessment Metrics
    fraud_probability = Column(Float, nullable=False, doc="Calibrated probability of fraud (0.0 to 1.0)")
    prediction_label = Column(String(50), nullable=False, doc="LEGITIMATE or FRAUDULENT")
    decision_threshold = Column(Float, nullable=False, doc="Operating decision threshold used")
    model_name = Column(String(100), nullable=False, doc="ML model descriptor")

    # Unified Risk Score Metrics
    overall_risk_score = Column(Integer, nullable=False, index=True, doc="Unified risk score (0 to 100)")
    risk_band = Column(String(50), nullable=False, index=True, doc="LOW RISK, MODERATE RISK, HIGH RISK, CRITICAL RISK")
    status = Column(String(50), nullable=False, doc="Assessment status (CLEAR, LOW_RISK, etc.)")
    components_json = Column(Text, nullable=False, doc="JSON encoded score components dictionary")

    # Company Trust & Intelligence
    company_trust_score = Column(Integer, nullable=False, doc="Company trust score (1 to 100)")
    company_domain = Column(String(255), nullable=True, doc="Extracted/verified company root domain")
    company_email = Column(String(255), nullable=True, doc="Extracted recruiter email")
    company_website = Column(String(1024), nullable=True, doc="Extracted company website URL")
    consistency_rating = Column(String(50), nullable=False, doc="Consistency rating: HIGH, MEDIUM, LOW, UNVERIFIED, MISMATCH")
    company_signals_json = Column(Text, nullable=True, doc="JSON encoded company intelligence signals")

    # Deterministic Rule Engine Summary
    rule_total_score = Column(Integer, nullable=False, doc="Sum of triggered rule suspicion scores")
    rule_count = Column(Integer, nullable=False, doc="Number of triggered rules")
    rule_suspicion_level = Column(String(50), nullable=False, doc="Qualitative rule suspicion level")
    rule_category_breakdown_json = Column(Text, nullable=True, doc="JSON encoded rule category breakdown")

    # Explanations, Corroborations & Recommendations Snapshot
    reasons_json = Column(Text, nullable=False, doc="JSON encoded list of explainable reasoning points")
    corroborations_json = Column(Text, nullable=False, doc="JSON encoded list of multi-signal corroborations")
    recommendations = Column(Text, nullable=False, doc="Actionable recommendation snapshot")

    # System & Model Metadata
    model_version = Column(String(100), nullable=False, doc="Trained model version")
    risk_config_version = Column(String(100), nullable=False, doc="Risk configuration version")
    api_version = Column(String(50), nullable=False, doc="API service version")

    # Relationships (Cascading on delete)
    user = relationship("User", back_populates="analyses")
    evidence = relationship(
        "AnalysisEvidence",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )
    company_verifications = relationship(
        "CompanyVerification",
        back_populates="analysis",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_analyses_session_created", "session_id", "created_at"),
        Index("ix_analyses_user_created", "user_id", "created_at"),
    )

    def __repr__(self) -> str:
        return f"<Analysis(id='{self.id}', title='{self.title}', risk={self.overall_risk_score}, session='{self.session_id}')>"


class AnalysisEvidence(Base):
    """Relational table storing individual structured evidence items and triggered scam rules."""

    __tablename__ = "analysis_evidence"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(
        String(36),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Foreign key to analysis record",
    )
    source = Column(String(50), nullable=False, doc="Originating module: RULE, ML, or COMPANY")
    rule_id = Column(String(100), nullable=True, doc="Rule ID e.g. RULE_01_PAYMENT_DEMAND")
    rule_name = Column(String(255), nullable=True, doc="Human-readable rule name")
    category = Column(String(100), nullable=True, doc="Rule category e.g. Financial Demands")
    severity = Column(String(50), nullable=False, doc="LOW, MEDIUM, HIGH, or CRITICAL")
    status = Column(String(50), nullable=False, doc="TRIGGERED, PASSED, SUSPICIOUS, or UNVERIFIED")
    score = Column(Integer, default=0, nullable=False, doc="Suspicion score contribution")
    explanation = Column(Text, nullable=True, doc="Detailed explanation of detected pattern")
    evidence = Column(Text, nullable=True, doc="Matched verbatim text excerpt or signal data")

    # Relationship back to Analysis
    analysis = relationship("Analysis", back_populates="evidence")

    def __repr__(self) -> str:
        return f"<AnalysisEvidence(id={self.id}, rule_id='{self.rule_id}', severity='{self.severity}')>"


class CompanyVerification(Base):
    """Relational table storing structured company and domain intelligence verification results."""

    __tablename__ = "company_verifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    analysis_id = Column(
        String(36),
        ForeignKey("analyses.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
        doc="Foreign key to analysis record",
    )
    company_name = Column(String(255), nullable=True, doc="Verified or extracted company name")
    website = Column(String(1024), nullable=True, doc="Company website URL")
    domain = Column(String(255), nullable=True, doc="Root domain")
    email = Column(String(255), nullable=True, doc="Recruiter contact email")
    email_domain = Column(String(255), nullable=True, doc="Extracted email domain")
    website_reachable = Column(Boolean, nullable=True, doc="Whether domain responded to HTTP/HTTPS")
    https_status = Column(Boolean, nullable=True, doc="Whether domain supports valid HTTPS")
    tls_status = Column(String(50), nullable=True, doc="TLS certificate validity status")
    consistency_rating = Column(String(50), nullable=False, doc="Cross-attribute alignment rating")
    trust_score = Column(Integer, nullable=False, doc="Calculated company trust score (1 to 100)")
    signals_json = Column(Text, nullable=True, doc="JSON encoded structured signals")

    # Relationship back to Analysis
    analysis = relationship("Analysis", back_populates="company_verifications")

    def __repr__(self) -> str:
        return f"<CompanyVerification(id={self.id}, company='{self.company_name}', trust={self.trust_score})>"
