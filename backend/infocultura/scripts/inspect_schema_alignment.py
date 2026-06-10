from __future__ import annotations

import argparse
import os
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from sqlalchemy import create_engine, inspect

from ..database.sqlalchemy_live_models import Base as LiveBase
from ..database.sqlalchemy_models import Base as TargetBase


BASE_DIR = Path(__file__).resolve().parent.parent.parent
load_dotenv(BASE_DIR / ".env")


def build_database_url() -> str:
    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "3306")
    database = os.getenv("DB_NAME", "EventSystem-ISPGAYA")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Compare the live MySQL schema with a SQLAlchemy metadata target.",
    )
    parser.add_argument(
        "--metadata",
        choices=("target", "live"),
        default="target",
        help="Choose which SQLAlchemy metadata to compare against.",
    )
    return parser.parse_args()


def resolve_metadata(mode: str) -> Any:
    return LiveBase.metadata if mode == "live" else TargetBase.metadata


def normalize_type(type_: Any) -> str:
    normalized = str(type_).lower()
    if normalized in {"boolean", "tinyint", "tinyint(1)"}:
        return "boolean"
    if normalized == "timestamp":
        return "datetime"
    return normalized


def model_columns(metadata: Any, table_name: str) -> dict[str, dict[str, Any]]:
    table = metadata.tables[table_name]
    return {
        column.name: {
            "type": normalize_type(column.type),
            "nullable": column.nullable,
            "primary_key": column.primary_key,
        }
        for column in table.columns
    }


def database_columns(inspector: Any, table_name: str) -> dict[str, dict[str, Any]]:
    primary_key = set(inspector.get_pk_constraint(table_name).get("constrained_columns") or [])
    return {
        column["name"]: {
            "type": normalize_type(column["type"]),
            "nullable": column["nullable"],
            "primary_key": column["name"] in primary_key,
        }
        for column in inspector.get_columns(table_name)
    }


def print_table_alignment(inspector: Any, metadata: Any, table_name: str) -> None:
    model = model_columns(metadata, table_name)
    database = database_columns(inspector, table_name)

    common_columns = sorted(model.keys() & database.keys())
    missing_in_db = sorted(model.keys() - database.keys())
    extra_in_db = sorted(database.keys() - model.keys())

    mismatches: list[str] = []
    for column_name in common_columns:
        model_column = model[column_name]
        db_column = database[column_name]

        differences: list[str] = []
        if model_column["type"] != db_column["type"]:
            differences.append(f"type model={model_column['type']} db={db_column['type']}")
        if model_column["nullable"] != db_column["nullable"]:
            differences.append(
                f"nullable model={model_column['nullable']} db={db_column['nullable']}"
            )
        if model_column["primary_key"] != db_column["primary_key"]:
            differences.append(
                f"primary_key model={model_column['primary_key']} db={db_column['primary_key']}"
            )

        if differences:
            mismatches.append(f"  - {column_name}: " + "; ".join(differences))

    print(f"\n[{table_name}]")
    print(f"  Common columns: {len(common_columns)}")

    if missing_in_db:
        print("  Missing columns in database:")
        for column_name in missing_in_db:
            print(f"    - {column_name}")

    if extra_in_db:
        print("  Extra columns in database:")
        for column_name in extra_in_db:
            print(f"    - {column_name}")

    if mismatches:
        print("  Column mismatches:")
        for line in mismatches:
            print(line)

    if not missing_in_db and not extra_in_db and not mismatches:
        print("  OK")


def main() -> None:
    args = parse_args()
    metadata = resolve_metadata(args.metadata)
    engine = create_engine(build_database_url())
    inspector = inspect(engine)

    ignored_db_tables = {"alembic_version"}
    db_tables = set(inspector.get_table_names()) - ignored_db_tables
    model_tables = set(metadata.tables.keys())

    print(f"Comparing live database against '{args.metadata}' metadata.")

    common_tables = sorted(db_tables & model_tables)
    missing_in_db = sorted(model_tables - db_tables)
    extra_in_db = sorted(db_tables - model_tables)

    print("Common tables:")
    for table_name in common_tables:
        print(f"  - {table_name}")

    print("\nMissing in database:")
    for table_name in missing_in_db:
        print(f"  - {table_name}")

    print("\nExtra in database:")
    for table_name in extra_in_db:
        print(f"  - {table_name}")

    if common_tables:
        print("\nColumn alignment for common tables:")
        for table_name in common_tables:
            print_table_alignment(inspector, metadata, table_name)


if __name__ == "__main__":
    main()
