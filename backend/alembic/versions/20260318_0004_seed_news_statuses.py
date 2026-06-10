"""Seed default news statuses

Revision ID: 20260318_0004
Revises: 20260318_0003
Create Date: 2026-03-18 18:05:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260318_0004"
down_revision = "20260318_0003"
branch_labels = None
depends_on = None


DEFAULT_NEWS_STATUSES = [
    ("draft", "News item is still being prepared."),
    ("published", "News item is visible in public channels."),
    ("archived", "News item is kept for history and no longer highlighted."),
]


def upgrade() -> None:
    news_status_table = sa.table(
        "nstatus",
        sa.column("name", sa.String(length=100)),
        sa.column("description", sa.Text()),
    )

    for name, description in DEFAULT_NEWS_STATUSES:
        op.execute(
            news_status_table.insert().from_select(
                ["name", "description"],
                sa.select(
                    sa.literal(name),
                    sa.literal(description),
                ).where(
                    sa.not_(
                        sa.exists(
                            sa.select(sa.literal(1))
                            .select_from(news_status_table)
                            .where(sa.func.lower(news_status_table.c.name) == name)
                        )
                    )
                ),
            )
        )


def downgrade() -> None:
    for name, _description in DEFAULT_NEWS_STATUSES:
        op.execute(
            sa.text(
                """
                DELETE FROM nstatus
                WHERE LOWER(name) = :name
                  AND NOT EXISTS (
                    SELECT 1
                    FROM news
                    WHERE news.id_nstatus = nstatus.id_nstatus
                  )
                """
            ).bindparams(name=name)
        )
