"""Add activity registrations and capacity controls

Revision ID: 20260408_0008
Revises: 20260319_0007
Create Date: 2026-04-08 19:10:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260408_0008"
down_revision = "20260319_0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sessions",
        sa.Column("enable_registrations", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "sessions",
        sa.Column("registration_capacity", sa.Integer(), nullable=True),
    )
    op.add_column(
        "event",
        sa.Column("enable_registrations", sa.Boolean(), nullable=False, server_default=sa.text("0")),
    )
    op.add_column(
        "event",
        sa.Column("registration_capacity", sa.Integer(), nullable=True),
    )

    op.create_table(
        "session_registrations",
        sa.Column("id_sessions", sa.Integer(), nullable=False),
        sa.Column("id_registrations", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("reminder_sent_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["id_registrations"], ["registrations.id_registrations"]),
        sa.ForeignKeyConstraint(["id_sessions"], ["sessions.id_sessions"]),
        sa.PrimaryKeyConstraint("id_sessions", "id_registrations"),
    )
    op.create_index(
        "ix_session_registrations_reminder",
        "session_registrations",
        ["reminder_sent_at", "created_at"],
        unique=False,
    )

    op.create_table(
        "event_registrations",
        sa.Column("id_event", sa.Integer(), nullable=False),
        sa.Column("id_registrations", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("reminder_sent_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["id_event"], ["event.id_event"]),
        sa.ForeignKeyConstraint(["id_registrations"], ["registrations.id_registrations"]),
        sa.PrimaryKeyConstraint("id_event", "id_registrations"),
    )
    op.create_index(
        "ix_event_registrations_reminder",
        "event_registrations",
        ["reminder_sent_at", "created_at"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("ix_event_registrations_reminder", table_name="event_registrations")
    op.drop_table("event_registrations")
    op.drop_index("ix_session_registrations_reminder", table_name="session_registrations")
    op.drop_table("session_registrations")
    op.drop_column("event", "registration_capacity")
    op.drop_column("event", "enable_registrations")
    op.drop_column("sessions", "registration_capacity")
    op.drop_column("sessions", "enable_registrations")
