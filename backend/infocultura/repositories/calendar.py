from __future__ import annotations

from datetime import datetime, timezone as dt_timezone
from urllib.parse import quote

from django.utils import timezone


def _build_google_calendar_url(*, title: str, description: str, start_date: datetime, end_date: datetime, location: str) -> str:
    def normalize_calendar_dt(value: datetime) -> str:
        aware_value = timezone.make_aware(value, timezone.get_current_timezone()) if timezone.is_naive(value) else value
        return timezone.localtime(aware_value, dt_timezone.utc).strftime("%Y%m%dT%H%M%SZ")

    query = (
        f"action=TEMPLATE&text={quote(title)}"
        f"&dates={normalize_calendar_dt(start_date)}/{normalize_calendar_dt(end_date)}"
        f"&details={quote(description)}"
        f"&location={quote(location)}"
    )
    return f"https://calendar.google.com/calendar/render?{query}"


def _build_outlook_calendar_url(*, title: str, description: str, start_date: datetime, end_date: datetime, location: str) -> str:
    def normalize_outlook_dt(value: datetime) -> str:
        aware_value = timezone.make_aware(value, timezone.get_current_timezone()) if timezone.is_naive(value) else value
        return timezone.localtime(aware_value, dt_timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    query = (
        f"path=/calendar/action/compose&rru=addevent"
        f"&subject={quote(title)}"
        f"&startdt={quote(normalize_outlook_dt(start_date))}"
        f"&enddt={quote(normalize_outlook_dt(end_date))}"
        f"&body={quote(description)}"
        f"&location={quote(location)}"
    )
    return f"https://outlook.office.com/calendar/0/deeplink/compose?{query}"


def build_activity_calendar_payload(*, activity_type: str, activity_id: int) -> dict:
    from ..models import Event, Session

    if activity_type == "event":
        activity = Event.objects.select_related("user__club").filter(id=activity_id).first()
        if not activity:
            return {}
        location = activity.location or activity.city or "Local por definir"
        return {
            "google_url": _build_google_calendar_url(
                title=activity.title,
                description=activity.description,
                start_date=activity.start_date,
                end_date=activity.end_date,
                location=location,
            ),
            "outlook_url": _build_outlook_calendar_url(
                title=activity.title,
                description=activity.description,
                start_date=activity.start_date,
                end_date=activity.end_date,
                location=location,
            ),
        }

    if activity_type == "session":
        activity = Session.objects.select_related("club").filter(id=activity_id).first()
        if not activity:
            return {}
        location = activity.location or activity.title
        return {
            "google_url": _build_google_calendar_url(
                title=activity.title,
                description=activity.description,
                start_date=activity.start_date,
                end_date=activity.end_date,
                location=location,
            ),
            "outlook_url": _build_outlook_calendar_url(
                title=activity.title,
                description=activity.description,
                start_date=activity.start_date,
                end_date=activity.end_date,
                location=location,
            ),
        }

    return {}


def get_upcoming_activities(queryset, limit: int = 5):
    return queryset.filter(end_date__gte=timezone.now()).order_by('start_date')[:limit]


def get_past_activities(queryset, limit: int = 5):
    return queryset.filter(end_date__lt=timezone.now()).order_by('-end_date')[:limit]


def filter_activities_by_range(queryset, start_from: datetime | None = None, end_to: datetime | None = None):
    if start_from:
        queryset = queryset.filter(start_date__gte=start_from)
    if end_to:
        queryset = queryset.filter(end_date__lte=end_to)
    return queryset
