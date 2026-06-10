from __future__ import annotations

from typing import Any

from django.db import connection


def fetch_all_dict_rows(sql: str, params: tuple[Any, ...] | list[Any] = ()) -> list[dict[str, Any]]:
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
        columns = [column[0] for column in cursor.description or []]
        return [dict(zip(columns, row)) for row in cursor.fetchall()]


def execute_sql(sql: str, params: tuple[Any, ...] | list[Any] = ()) -> None:
    with connection.cursor() as cursor:
        cursor.execute(sql, params)
