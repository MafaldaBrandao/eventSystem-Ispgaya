"""Initial live MySQL baseline

Revision ID: 20260318_0001
Revises: None
Create Date: 2026-03-18 15:20:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260318_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=50), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.UniqueConstraint("name", name="name"),
    )

    op.create_table(
        "clubs",
        sa.Column("id_clubs", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("mission", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("enable_registrations", sa.Boolean(), nullable=True),
    )

    op.create_table(
        "registrations",
        sa.Column("id_registrations", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("phone", sa.String(length=20), nullable=True),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False, server_default=sa.text("'pending'")),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("email", sa.String(length=150), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=True, server_default=sa.text("1")),
        sa.Column("created_at", sa.DateTime(), nullable=True, server_default=sa.text("CURRENT_TIMESTAMP")),
        sa.Column("id_clubs", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["id_clubs"], ["clubs.id_clubs"], name="fk_users_clubs", onupdate="CASCADE", ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], name="fk_user_role"),
        sa.UniqueConstraint("email", name="email"),
    )

    op.create_index("fk_user_role", "users", ["role_id"], unique=False)
    op.create_index("fk_users_clubs", "users", ["id_clubs"], unique=False)


def downgrade() -> None:
    op.drop_index("fk_users_clubs", table_name="users")
    op.drop_index("fk_user_role", table_name="users")
    op.drop_table("users")
    op.drop_table("registrations")
    op.drop_table("clubs")
    op.drop_table("roles")
