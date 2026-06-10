"""Add Eventbrite venue and ticket configuration

Revision ID: 20260527_0013
Revises: 20260526_0012
Create Date: 2026-05-27 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260527_0013"
down_revision = "20260526_0012"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if not _has_column(table_name, column.name):
        op.add_column(table_name, column)


def _drop_column_if_present(table_name: str, column_name: str) -> None:
    if _has_column(table_name, column_name):
        op.drop_column(table_name, column_name)


def upgrade() -> None:
    _add_column_if_missing("event", sa.Column("eventbrite_venue_id", sa.String(length=64), nullable=False, server_default=""))
    _add_column_if_missing("event", sa.Column("eventbrite_venue", sa.JSON(), nullable=True))
    _add_column_if_missing("event", sa.Column("eventbrite_ticket_classes", sa.JSON(), nullable=True))


def downgrade() -> None:
    _drop_column_if_present("event", "eventbrite_ticket_classes")
    _drop_column_if_present("event", "eventbrite_venue")
    _drop_column_if_present("event", "eventbrite_venue_id")
