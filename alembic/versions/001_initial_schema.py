"""initial persistence schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-09-19 19:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create analyses table
    op.create_table(
        'analyses',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('request_id', sa.String(length=36), nullable=False),
        sa.Column('session_id', sa.String(length=64), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=True),
        sa.Column('company_name', sa.String(length=255), nullable=True),
        sa.Column('location', sa.String(length=255), nullable=True),
        sa.Column('department', sa.String(length=255), nullable=True),
        sa.Column('salary_range', sa.String(length=100), nullable=True),
        sa.Column('employment_type', sa.String(length=100), nullable=True),
        sa.Column('required_experience', sa.String(length=100), nullable=True),
        sa.Column('required_education', sa.String(length=100), nullable=True),
        sa.Column('industry', sa.String(length=100), nullable=True),
        sa.Column('function', sa.String(length=100), nullable=True),
        sa.Column('telecommuting', sa.Boolean(), nullable=False),
        sa.Column('has_company_logo', sa.Boolean(), nullable=False),
        sa.Column('has_questions', sa.Boolean(), nullable=False),
        sa.Column('recruiter_email', sa.String(length=255), nullable=True),
        sa.Column('url', sa.String(length=1024), nullable=True),
        sa.Column('company_profile', sa.Text(), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('benefits', sa.Text(), nullable=True),
        sa.Column('fraud_probability', sa.Float(), nullable=False),
        sa.Column('prediction_label', sa.String(length=50), nullable=False),
        sa.Column('decision_threshold', sa.Float(), nullable=False),
        sa.Column('model_name', sa.String(length=100), nullable=False),
        sa.Column('overall_risk_score', sa.Integer(), nullable=False),
        sa.Column('risk_band', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('components_json', sa.Text(), nullable=False),
        sa.Column('company_trust_score', sa.Integer(), nullable=False),
        sa.Column('company_domain', sa.String(length=255), nullable=True),
        sa.Column('company_email', sa.String(length=255), nullable=True),
        sa.Column('company_website', sa.String(length=1024), nullable=True),
        sa.Column('consistency_rating', sa.String(length=50), nullable=False),
        sa.Column('company_signals_json', sa.Text(), nullable=True),
        sa.Column('rule_total_score', sa.Integer(), nullable=False),
        sa.Column('rule_count', sa.Integer(), nullable=False),
        sa.Column('rule_suspicion_level', sa.String(length=50), nullable=False),
        sa.Column('rule_category_breakdown_json', sa.Text(), nullable=True),
        sa.Column('reasons_json', sa.Text(), nullable=False),
        sa.Column('corroborations_json', sa.Text(), nullable=False),
        sa.Column('recommendations', sa.Text(), nullable=False),
        sa.Column('model_version', sa.String(length=100), nullable=False),
        sa.Column('risk_config_version', sa.String(length=100), nullable=False),
        sa.Column('api_version', sa.String(length=50), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analyses_id'), 'analyses', ['id'], unique=False)
    op.create_index(op.f('ix_analyses_request_id'), 'analyses', ['request_id'], unique=False)
    op.create_index(op.f('ix_analyses_session_id'), 'analyses', ['session_id'], unique=False)
    op.create_index(op.f('ix_analyses_created_at'), 'analyses', ['created_at'], unique=False)
    op.create_index(op.f('ix_analyses_overall_risk_score'), 'analyses', ['overall_risk_score'], unique=False)
    op.create_index('ix_analyses_session_created', 'analyses', ['session_id', 'created_at'], unique=False)

    # Create analysis_evidence table
    op.create_table(
        'analysis_evidence',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('analysis_id', sa.String(length=36), nullable=False),
        sa.Column('source', sa.String(length=50), nullable=False),
        sa.Column('rule_id', sa.String(length=100), nullable=True),
        sa.Column('rule_name', sa.String(length=255), nullable=True),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('severity', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.Text(), nullable=True),
        sa.Column('evidence', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_analysis_evidence_analysis_id'), 'analysis_evidence', ['analysis_id'], unique=False)

    # Create company_verifications table
    op.create_table(
        'company_verifications',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('analysis_id', sa.String(length=36), nullable=False),
        sa.Column('company_name', sa.String(length=255), nullable=True),
        sa.Column('website', sa.String(length=1024), nullable=True),
        sa.Column('domain', sa.String(length=255), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('email_domain', sa.String(length=255), nullable=True),
        sa.Column('website_reachable', sa.Boolean(), nullable=True),
        sa.Column('https_status', sa.Boolean(), nullable=True),
        sa.Column('tls_status', sa.String(length=50), nullable=True),
        sa.Column('consistency_rating', sa.String(length=50), nullable=False),
        sa.Column('trust_score', sa.Integer(), nullable=False),
        sa.Column('signals_json', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['analysis_id'], ['analyses.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_company_verifications_analysis_id'), 'company_verifications', ['analysis_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_company_verifications_analysis_id'), table_name='company_verifications')
    op.drop_table('company_verifications')
    op.drop_index(op.f('ix_analysis_evidence_analysis_id'), table_name='analysis_evidence')
    op.drop_table('analysis_evidence')
    op.drop_index('ix_analyses_session_created', table_name='analyses')
    op.drop_index(op.f('ix_analyses_overall_risk_score'), table_name='analyses')
    op.drop_index(op.f('ix_analyses_created_at'), table_name='analyses')
    op.drop_index(op.f('ix_analyses_session_id'), table_name='analyses')
    op.drop_index(op.f('ix_analyses_request_id'), table_name='analyses')
    op.drop_index(op.f('ix_analyses_id'), table_name='analyses')
    op.drop_table('analyses')
