"""Expand managed cultural schema

Revision ID: 20260318_0002
Revises: 20260318_0001
Create Date: 2026-03-18 16:35:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260318_0002"
down_revision = "20260318_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "category",
        sa.Column("id_category", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "news_letter_subscribers",
        sa.Column("id_newsletter_sub", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("subscribed_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.UniqueConstraint("email", name="uq_news_letter_subscribers_email"),
    )

    op.create_table(
        "nstatus",
        sa.Column("id_nstatus", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
    )

    op.create_table(
        "rstatus",
        sa.Column("id_rstatus", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
    )

    op.create_table(
        "books",
        sa.Column("id_books", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("author", sa.String(length=255), nullable=False),
        sa.Column("publisher", sa.String(length=255), nullable=False, server_default=sa.text("''")),
        sa.Column("publication_year", sa.Integer(), nullable=False),
        sa.Column("cover_image", sa.String(length=500), nullable=False, server_default=sa.text("''")),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("is_featured", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("id_club", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["id_club"], ["clubs.id_clubs"]),
    )

    op.create_table(
        "sessions",
        sa.Column("id_sessions", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("session_date", sa.Date(), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column("id_club", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["id_club"], ["clubs.id_clubs"]),
    )

    op.create_table(
        "clubs_registrations",
        sa.Column("id_clubs", sa.Integer(), nullable=False),
        sa.Column("id_registrations", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["id_clubs"], ["clubs.id_clubs"]),
        sa.ForeignKeyConstraint(["id_registrations"], ["registrations.id_registrations"]),
        sa.PrimaryKeyConstraint("id_clubs", "id_registrations"),
    )

    op.create_table(
        "event",
        sa.Column("id_event", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("event_date", sa.Date(), nullable=False),
        sa.Column("start_date", sa.DateTime(), nullable=False),
        sa.Column("end_date", sa.DateTime(), nullable=False),
        sa.Column("image", sa.String(length=500), nullable=False, server_default=sa.text("''")),
        sa.Column("is_external", sa.Boolean(), nullable=False, server_default=sa.text("0")),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("city", sa.String(length=120), nullable=False, server_default=sa.text("''")),
        sa.Column("location", sa.String(length=255), nullable=False, server_default=sa.text("''")),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "news",
        sa.Column("id_news", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("image", sa.String(length=500), nullable=False, server_default=sa.text("''")),
        sa.Column("id_nstatus", sa.Integer(), nullable=False),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("id_clubs", sa.Integer(), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("updated_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["id_clubs"], ["clubs.id_clubs"]),
        sa.ForeignKeyConstraint(["id_nstatus"], ["nstatus.id_nstatus"]),
    )

    op.create_table(
        "newsletters",
        sa.Column("id_newsletter", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("subject", sa.String(length=255), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("sent_at", sa.DateTime(), nullable=True),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
    )

    op.create_table(
        "event_category",
        sa.Column("id_event", sa.Integer(), nullable=False),
        sa.Column("id_category", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["id_category"], ["category.id_category"]),
        sa.ForeignKeyConstraint(["id_event"], ["event.id_event"]),
        sa.PrimaryKeyConstraint("id_event", "id_category"),
    )


def downgrade() -> None:
    op.drop_table("event_category")
    op.drop_table("newsletters")
    op.drop_table("news")
    op.drop_table("event")
    op.drop_table("clubs_registrations")
    op.drop_table("sessions")
    op.drop_table("books")
    op.drop_table("rstatus")
    op.drop_table("nstatus")
    op.drop_table("news_letter_subscribers")
    op.drop_table("category")
