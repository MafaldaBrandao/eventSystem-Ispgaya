"""Allow club deletion by nulling dependent content references

Revision ID: 20260417_0011
Revises: 20260417_0010
Create Date: 2026-04-17 18:35:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260417_0011"
down_revision = "20260417_0010"
branch_labels = None
depends_on = None


def _drop_fk_if_present(table_name: str, constrained_columns: tuple[str, ...]) -> None:
    bind = op.get_bind()
    inspector = inspect(bind)

    for foreign_key in inspector.get_foreign_keys(table_name):
        current_columns = tuple(foreign_key.get("constrained_columns") or ())
        if current_columns == constrained_columns:
            fk_name = foreign_key.get("name")
            if fk_name:
                op.drop_constraint(fk_name, table_name, type_="foreignkey")
            return


def upgrade() -> None:
    _drop_fk_if_present("books", ("id_club",))
    op.alter_column("books", "id_club", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(
        "fk_books_club_set_null",
        "books",
        "clubs",
        ["id_club"],
        ["id_clubs"],
        ondelete="SET NULL",
    )

    _drop_fk_if_present("sessions", ("id_club",))
    op.alter_column("sessions", "id_club", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(
        "fk_sessions_club_set_null",
        "sessions",
        "clubs",
        ["id_club"],
        ["id_clubs"],
        ondelete="SET NULL",
    )

    _drop_fk_if_present("news", ("id_clubs",))
    op.alter_column("news", "id_clubs", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(
        "fk_news_club_set_null",
        "news",
        "clubs",
        ["id_clubs"],
        ["id_clubs"],
        ondelete="SET NULL",
    )

    _drop_fk_if_present("clubs_registrations", ("id_clubs",))
    op.create_foreign_key(
        "fk_clubs_registrations_club_cascade",
        "clubs_registrations",
        "clubs",
        ["id_clubs"],
        ["id_clubs"],
        ondelete="CASCADE",
    )


def downgrade() -> None:
    _drop_fk_if_present("clubs_registrations", ("id_clubs",))
    op.create_foreign_key(
        "fk_clubs_registrations_club",
        "clubs_registrations",
        "clubs",
        ["id_clubs"],
        ["id_clubs"],
    )

    _drop_fk_if_present("news", ("id_clubs",))
    op.create_foreign_key(
        "fk_news_club",
        "news",
        "clubs",
        ["id_clubs"],
        ["id_clubs"],
    )
    op.alter_column("news", "id_clubs", existing_type=sa.Integer(), nullable=False)

    _drop_fk_if_present("sessions", ("id_club",))
    op.create_foreign_key(
        "fk_sessions_club",
        "sessions",
        "clubs",
        ["id_club"],
        ["id_clubs"],
    )
    op.alter_column("sessions", "id_club", existing_type=sa.Integer(), nullable=False)

    _drop_fk_if_present("books", ("id_club",))
    op.create_foreign_key(
        "fk_books_club",
        "books",
        "clubs",
        ["id_club"],
        ["id_clubs"],
    )
    op.alter_column("books", "id_club", existing_type=sa.Integer(), nullable=False)
