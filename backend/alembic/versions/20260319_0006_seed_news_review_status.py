"""Seed review news status

Revision ID: 20260319_0006
Revises: 20260319_0005
Create Date: 2026-03-19 12:10:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260319_0006"
down_revision = "20260319_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    news_status_table = sa.table(
        "nstatus",
        sa.column("name", sa.String(length=100)),
        sa.column("description", sa.Text()),
    )

    op.execute(
        news_status_table.insert().from_select(
            ["name", "description"],
            sa.select(
                sa.literal("review"),
                sa.literal("News item is waiting for editorial validation."),
            ).where(
                sa.not_(
                    sa.exists(
                        sa.select(sa.literal(1))
                        .select_from(news_status_table)
                        .where(sa.func.lower(news_status_table.c.name) == "review")
                    )
                )
            ),
        )
    )


def downgrade() -> None:
    op.execute(
        sa.text(
            """
            DELETE FROM nstatus
            WHERE LOWER(name) = 'review'
              AND NOT EXISTS (
                SELECT 1
                FROM news
                WHERE news.id_nstatus = nstatus.id_nstatus
              )
            """
        )
    )
