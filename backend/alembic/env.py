from __future__ import annotations

import os
from pathlib import Path
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool
from dotenv import load_dotenv

from infocultura.database.sqlalchemy_live_models import Base


config = context.config

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

if config.config_file_name is not None:
    fileConfig(config.config_file_name)


target_metadata = Base.metadata
managed_tables = set(target_metadata.tables.keys())


def build_database_url() -> str:
    """Build the SQLAlchemy database URL from the backend environment variables."""

    user = os.getenv("DB_USER", "root")
    password = os.getenv("DB_PASSWORD", "")
    host = os.getenv("DB_HOST", "127.0.0.1")
    port = os.getenv("DB_PORT", "3306")
    database = os.getenv("DB_NAME", "EventSystem-ISPGAYA")
    return f"mysql+pymysql://{user}:{password}@{host}:{port}/{database}?charset=utf8mb4"


def get_url() -> str:
    configured_url = config.get_main_option("sqlalchemy.url")
    return configured_url or build_database_url()


def include_object(object_, name, type_, reflected, compare_to) -> bool:
    """Limit Alembic autogenerate to the live baseline tables we manage here."""

    if type_ == "table" and reflected and name not in managed_tables:
        return False
    return True


def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode."""

    context.configure(
        url=get_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
        include_object=include_object,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode."""

    configuration = config.get_section(config.config_ini_section, {})
    configuration["sqlalchemy.url"] = get_url()

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
        future=True,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
            include_object=include_object,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
