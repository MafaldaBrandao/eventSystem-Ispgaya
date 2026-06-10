"""Add Eventbrite sync fields to events

Revision ID: 20260526_0012
Revises: 20260417_0011
Create Date: 2026-05-26 00:00:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260526_0012"
down_revision = "20260417_0011"
branch_labels = None
depends_on = None


def _has_column(table_name: str, column_name: str) -> bool:
    inspector = inspect(op.get_bind())
    return any(column["name"] == column_name for column in inspector.get_columns(table_name))


def _has_index(table_name: str, index_name: str) -> bool:
    inspector = inspect(op.get_bind())
    return any(index["name"] == index_name for index in inspector.get_indexes(table_name))


def _add_column_if_missing(table_name: str, column: sa.Column) -> None:
    if not _has_column(table_name, column.name):
        op.add_column(table_name, column)


def _drop_column_if_present(table_name: str, column_name: str) -> None:
    if _has_column(table_name, column_name):
        op.drop_column(table_name, column_name)


def upgrade() -> None:
    # eventbrite_event_id: optional, only populated after Eventbrite sync
    _add_column_if_missing("event", sa.Column("eventbrite_event_id", sa.String(length=64), nullable=True, server_default=None))
    _add_column_if_missing("event", sa.Column("eventbrite_url", sa.String(length=500), nullable=True, server_default=None))
    _add_column_if_missing("event", sa.Column("eventbrite_status", sa.String(length=32), nullable=True, server_default=None))
    _add_column_if_missing("event", sa.Column("eventbrite_last_synced_at", sa.DateTime(), nullable=True))
    _add_column_if_missing("event", sa.Column("eventbrite_last_error", sa.Text(), nullable=True))
    if not _has_index("event", "ix_event_eventbrite_event_id"):
        op.create_index("ix_event_eventbrite_event_id", "event", ["eventbrite_event_id"], unique=False)


def downgrade() -> None:
    if _has_index("event", "ix_event_eventbrite_event_id"):
        op.drop_index("ix_event_eventbrite_event_id", table_name="event")
    _drop_column_if_present("event", "eventbrite_last_error")
    _drop_column_if_present("event", "eventbrite_last_synced_at")
    _drop_column_if_present("event", "eventbrite_status")
    _drop_column_if_present("event", "eventbrite_url")
    _drop_column_if_present("event", "eventbrite_event_id")
