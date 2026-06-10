from __future__ import annotations

from pathlib import Path

from sqlalchemy.schema import CreateTable
from sqlalchemy.dialects import mysql

from ..database.sqlalchemy_models import Base


OUTPUT_FILE = Path(__file__).parent.parent / "database" / "sqlalchemy_schema.sql"


def render_mysql_ddl() -> str:
    """Render MySQL DDL for all SQLAlchemy models in dependency order."""

    dialect = mysql.dialect()
    statements: list[str] = [
        "-- Auto-generated from infocultura.sqlalchemy_models",
        "-- Regenerate with: python -m infocultura.generate_sqlalchemy_ddl",
        "",
    ]

    for table in Base.metadata.sorted_tables:
        compiled = str(CreateTable(table).compile(dialect=dialect)).strip()
        statements.append(f"{compiled};")
        statements.append("")

    return "\n".join(statements).rstrip() + "\n"


def write_mysql_ddl(output_path: Path = OUTPUT_FILE) -> Path:
    """Generate and persist the MySQL DDL script for the current metadata."""

    output_path.write_text(render_mysql_ddl(), encoding="utf-8")
    return output_path


if __name__ == "__main__":
    path = write_mysql_ddl()
    print(f"Generated DDL at: {path}")
