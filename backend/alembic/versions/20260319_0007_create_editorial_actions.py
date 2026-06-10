"""Create editorial actions audit table

Revision ID: 20260319_0007
Revises: 20260319_0006
Create Date: 2026-03-19 13:05:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260319_0007"
down_revision = "20260319_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "editorial_actions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("content_type", sa.String(length=32), nullable=False),
        sa.Column("object_id", sa.Integer(), nullable=False),
        sa.Column("from_status", sa.String(length=50), nullable=True),
        sa.Column("to_status", sa.String(length=50), nullable=False),
        sa.Column("actor_user_id", sa.Integer(), nullable=True),
        sa.Column("actor_name", sa.String(length=150), nullable=False),
        sa.Column("club_id", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["actor_user_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["club_id"], ["clubs.id_clubs"], ondelete="SET NULL"),
    )
    op.create_index(
        "ix_editorial_actions_lookup",
        "editorial_actions",
        ["content_type", "object_id", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_editorial_actions_lookup", table_name="editorial_actions")
    op.drop_table("editorial_actions")
