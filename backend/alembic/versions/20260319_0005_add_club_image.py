"""Add club image column

Revision ID: 20260319_0005
Revises: 20260318_0004
Create Date: 2026-03-19 11:25:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260319_0005"
down_revision = "20260318_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "clubs",
        sa.Column("image", sa.String(length=500), nullable=False, server_default=sa.text("''")),
    )


def downgrade() -> None:
    op.drop_column("clubs", "image")
