"""user authentication and analysis ownership
Revision ID: 002_user_authentication
Revises: 001_initial_schema
Create Date: 2026-09-19 20:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '002_user_authentication'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create users table
    op.create_table(
        'users',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_id'), 'users', ['id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_created_at'), 'users', ['created_at'], unique=False)

    # 2. Add user_id column and foreign key to analyses
    # Using batch operations for SQLite compatibility
    with op.batch_alter_table('analyses') as batch_op:
        batch_op.add_column(sa.Column('user_id', sa.String(length=36), nullable=True))
        batch_op.create_index(op.f('ix_analyses_user_id'), ['user_id'], unique=False)
        batch_op.create_index('ix_analyses_user_created', ['user_id', 'created_at'], unique=False)
        batch_op.create_foreign_key(
            'fk_analyses_user_id_users',
            'users',
            ['user_id'],
            ['id'],
            ondelete='CASCADE',
        )


def downgrade() -> None:
    with op.batch_alter_table('analyses') as batch_op:
        batch_op.drop_constraint('fk_analyses_user_id_users', type_='foreignkey')
        batch_op.drop_index('ix_analyses_user_created')
        batch_op.drop_index(op.f('ix_analyses_user_id'))
        batch_op.drop_column('user_id')

    op.drop_index(op.f('ix_users_created_at'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_id'), table_name='users')
    op.drop_table('users')
