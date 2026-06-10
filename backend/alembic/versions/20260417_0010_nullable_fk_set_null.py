"""Allow nullable ownership/status foreign keys to use SET NULL

Revision ID: 20260417_0010
Revises: 20260408_0009
Create Date: 2026-04-17 18:10:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "20260417_0010"
down_revision = "20260408_0009"
branch_labels = None
depends_on = None


def _drop_fk_if_present(table_name: str, constrained_columns: tuple[str, ...]) -> str | None:
    bind = op.get_bind()
    inspector = inspect(bind)

    for foreign_key in inspector.get_foreign_keys(table_name):
        current_columns = tuple(foreign_key.get("constrained_columns") or ())
        if current_columns == constrained_columns:
            fk_name = foreign_key.get("name")
            if fk_name:
                op.drop_constraint(fk_name, table_name, type_="foreignkey")
            return fk_name

    return None


def upgrade() -> None:
    _drop_fk_if_present("event", ("user_id",))
    op.alter_column("event", "user_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(
        "fk_event_user_set_null",
        "event",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    _drop_fk_if_present("newsletters", ("user_id",))
    op.alter_column("newsletters", "user_id", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(
        "fk_newsletters_user_set_null",
        "newsletters",
        "users",
        ["user_id"],
        ["id"],
        ondelete="SET NULL",
    )

    _drop_fk_if_present("registrations", ("id_rstatus",))
    op.alter_column("registrations", "id_rstatus", existing_type=sa.Integer(), nullable=True)
    op.create_foreign_key(
        "fk_registrations_rstatus",
        "registrations",
        "rstatus",
        ["id_rstatus"],
        ["id_rstatus"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    _drop_fk_if_present("registrations", ("id_rstatus",))
    op.create_foreign_key(
        "fk_registrations_rstatus",
        "registrations",
        "rstatus",
        ["id_rstatus"],
        ["id_rstatus"],
    )

    _drop_fk_if_present("newsletters", ("user_id",))
    op.create_foreign_key(
        "fk_newsletters_user",
        "newsletters",
        "users",
        ["user_id"],
        ["id"],
    )
    op.alter_column("newsletters", "user_id", existing_type=sa.Integer(), nullable=False)

    _drop_fk_if_present("event", ("user_id",))
    op.create_foreign_key(
        "fk_event_user",
        "event",
        "users",
        ["user_id"],
        ["id"],
    )
    op.alter_column("event", "user_id", existing_type=sa.Integer(), nullable=False)
