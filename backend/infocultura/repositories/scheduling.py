from __future__ import annotations

from datetime import datetime


def validate_date_interval(start_date: datetime, end_date: datetime) -> None:
    if start_date and end_date and start_date >= end_date:
        raise ValueError("A data de fim deve ser posterior a data de inicio.")
