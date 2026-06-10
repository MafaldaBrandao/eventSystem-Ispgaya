"""Add location field to sessions

Revision ID: 20260604_0014
Revises: 20260527_0013
Create Date: 2026-06-04 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260604_0014"
down_revision = "20260527_0013"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def upgrade() -> None:
    if not _has_column("sessions", "location"):
        op.add_column(
            "sessions",
            sa.Column("location", sa.String(length=255), nullable=False, server_default=""),
        )


def downgrade() -> None:
    if _has_column("sessions", "location"):
        op.drop_column("sessions", "location")
