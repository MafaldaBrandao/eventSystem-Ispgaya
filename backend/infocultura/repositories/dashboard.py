from __future__ import annotations

from datetime import datetime

from django.db.models import Q
from django.utils import timezone

from ..models import Event, News, Registration
from ..service_types import AdminNotificationRecord


def _get_allowed_club_id(user) -> int | None:
    role_name = getattr(getattr(user, "role", None), "name", None)
    if role_name == "club_admin":
        return user.club_id
    return None


def get_admin_dashboard_metrics(*, user) -> dict:
    club_id = _get_allowed_club_id(user)

    event_qs = Event.objects.all()
    news_qs = News.objects.all()
    reg_qs = Registration.objects.all()

    if club_id:
        event_qs = event_qs.filter(user__club_id=club_id)
        news_qs = news_qs.filter(club_id=club_id)
        reg_qs = reg_qs.filter(
            Q(club_links__club_id=club_id)
            | Q(event_links__event__user__club_id=club_id)
            | Q(session_links__session__club_id=club_id)
        ).distinct()

    return {
        "total_events": event_qs.count(),
        "total_news": news_qs.count(),
        "total_registrations": reg_qs.count(),
        "pending_registrations": reg_qs.filter(status="pending").count(),
    }


def get_admin_notifications(*, user) -> list[AdminNotificationRecord]:
    club_id = _get_allowed_club_id(user)

    news_qs = News.objects.select_related("news_status", "club").all()
    registration_qs = Registration.objects.all()

    if club_id:
        news_qs = news_qs.filter(club_id=club_id)
        registration_qs = registration_qs.filter(
            Q(club_links__club_id=club_id)
            | Q(event_links__event__user__club_id=club_id)
            | Q(session_links__session__club_id=club_id)
        ).distinct()

    notifications: list[AdminNotificationRecord] = []

    for news in news_qs.filter(news_status__name__iexact="review").order_by("-updated_at", "-created_at", "-id")[:8]:
        notifications.append(
            AdminNotificationRecord(
                id=f"news-review-{news.id}",
                kind="editorial",
                level="warning",
                title="Noticia em revisao",
                message=f"{news.title} aguarda validacao editorial.",
                href="/infocultura/noticias",
                created_at=news.updated_at or news.created_at,
            )
        )

    for registration in registration_qs.filter(status__iexact="pending").order_by("-created_at", "-id")[:8]:
        notifications.append(
            AdminNotificationRecord(
                id=f"registration-pending-{registration.id}",
                kind="registration",
                level="warning",
                title="Inscricao por validar",
                message=f"{registration.name} submeteu uma inscricao pendente.",
                href="/infocultura/inscricoes",
                created_at=registration.created_at,
            )
        )

    fallback_date = timezone.make_aware(datetime(1970, 1, 1))
    notifications.sort(key=lambda item: item.created_at or fallback_date, reverse=True)
    return notifications[:12]
