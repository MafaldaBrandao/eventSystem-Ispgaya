"""Normalize registrations toward rstatus with compatibility sync

Revision ID: 20260318_0003
Revises: 20260318_0002
Create Date: 2026-03-18 17:25:00
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "20260318_0003"
down_revision = "20260318_0002"
branch_labels = None
depends_on = None


DEFAULT_REGISTRATION_STATUSES = [
    ("pending", "Registration is awaiting review."),
    ("approved", "Registration has been approved."),
    ("rejected", "Registration has been rejected."),
    ("cancelled", "Registration has been cancelled."),
]


def upgrade() -> None:
    registration_status_table = sa.table(
        "rstatus",
        sa.column("name", sa.String(length=100)),
        sa.column("description", sa.Text()),
    )

    for name, description in DEFAULT_REGISTRATION_STATUSES:
        op.execute(
            registration_status_table.insert().from_select(
                ["name", "description"],
                sa.select(
                    sa.literal(name),
                    sa.literal(description),
                ).where(
                    sa.not_(
                        sa.exists(
                            sa.select(sa.literal(1))
                            .select_from(registration_status_table)
                            .where(sa.func.lower(registration_status_table.c.name) == name)
                        )
                    )
                ),
            )
        )

    op.add_column("registrations", sa.Column("id_rstatus", sa.Integer(), nullable=True))
    op.create_foreign_key(
        "fk_registrations_rstatus",
        "registrations",
        "rstatus",
        ["id_rstatus"],
        ["id_rstatus"],
    )

    op.execute(
        """
        INSERT INTO rstatus (name, description)
        SELECT DISTINCT TRIM(r.status), CONCAT('Imported from registrations.status value: ', TRIM(r.status))
        FROM registrations AS r
        WHERE TRIM(COALESCE(r.status, '')) <> ''
          AND NOT EXISTS (
            SELECT 1
            FROM rstatus AS rs
            WHERE LOWER(rs.name) = LOWER(TRIM(r.status))
          )
        """
    )

    op.execute(
        """
        UPDATE registrations AS r
        JOIN rstatus AS rs
          ON LOWER(TRIM(r.status)) = LOWER(rs.name)
        SET r.id_rstatus = rs.id_rstatus
        WHERE r.id_rstatus IS NULL
          AND TRIM(COALESCE(r.status, '')) <> ''
        """
    )

    op.execute(
        """
        UPDATE registrations
        SET id_rstatus = (
          SELECT rs.id_rstatus
          FROM rstatus AS rs
          WHERE rs.name = 'pending'
          LIMIT 1
        )
        WHERE id_rstatus IS NULL
        """
    )

    op.execute("DROP TRIGGER IF EXISTS trg_registrations_bi_sync_status")
    op.execute(
        """
        CREATE TRIGGER trg_registrations_bi_sync_status
        BEFORE INSERT ON registrations
        FOR EACH ROW
        BEGIN
            IF NEW.id_rstatus IS NULL AND TRIM(COALESCE(NEW.status, '')) <> '' THEN
                SET NEW.id_rstatus = (
                    SELECT rs.id_rstatus
                    FROM rstatus AS rs
                    WHERE LOWER(rs.name) = LOWER(TRIM(NEW.status))
                    LIMIT 1
                );
            END IF;

            IF NEW.id_rstatus IS NULL THEN
                SET NEW.id_rstatus = (
                    SELECT rs.id_rstatus
                    FROM rstatus AS rs
                    WHERE rs.name = 'pending'
                    LIMIT 1
                );
            END IF;

            IF TRIM(COALESCE(NEW.status, '')) = '' THEN
                SET NEW.status = (
                    SELECT rs.name
                    FROM rstatus AS rs
                    WHERE rs.id_rstatus = NEW.id_rstatus
                    LIMIT 1
                );
            END IF;
        END
        """
    )

    op.execute("DROP TRIGGER IF EXISTS trg_registrations_bu_sync_status")
    op.execute(
        """
        CREATE TRIGGER trg_registrations_bu_sync_status
        BEFORE UPDATE ON registrations
        FOR EACH ROW
        BEGIN
            IF NEW.id_rstatus IS NULL AND TRIM(COALESCE(NEW.status, '')) <> '' THEN
                SET NEW.id_rstatus = (
                    SELECT rs.id_rstatus
                    FROM rstatus AS rs
                    WHERE LOWER(rs.name) = LOWER(TRIM(NEW.status))
                    LIMIT 1
                );
            END IF;

            IF TRIM(COALESCE(NEW.status, '')) = '' AND NEW.id_rstatus IS NOT NULL THEN
                SET NEW.status = (
                    SELECT rs.name
                    FROM rstatus AS rs
                    WHERE rs.id_rstatus = NEW.id_rstatus
                    LIMIT 1
                );
            END IF;
        END
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS trg_registrations_bu_sync_status")
    op.execute("DROP TRIGGER IF EXISTS trg_registrations_bi_sync_status")
    op.drop_constraint("fk_registrations_rstatus", "registrations", type_="foreignkey")
    op.drop_column("registrations", "id_rstatus")
