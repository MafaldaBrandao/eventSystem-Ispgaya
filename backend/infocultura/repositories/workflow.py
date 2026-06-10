from __future__ import annotations

from ..models import Event, News


def notify_event_workflow_status(*, event: Event, previous_status: str | None, next_status: str) -> None:
    return None


def notify_news_workflow_status(*, news: News, previous_status: str | None, next_status: str) -> None:
    return None
