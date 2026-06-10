from __future__ import annotations

import json
from datetime import datetime

from django.utils import timezone

from ..models import AdminAuditLog, AppUser, Club, EditorialAction
from ..service_types import AdminActivityLogRecord, AdminAuditLogRecord, EditorialHistoryRecord


def record_admin_audit_action(
    *,
    action: str,
    content_type: str,
    object_id: int | None = None,
    summary: str,
    actor_user: AppUser | None,
    club_id: int | None = None,
    metadata: dict | None = None,
    actor_name: str | None = None,
) -> None:
    AdminAuditLog.objects.create(
        action=action,
        content_type=content_type,
        object_id=object_id,
        summary=summary,
        actor_user=actor_user,
        actor_name=actor_name or (actor_user.name if actor_user is not None else 'Visitante'),
        club=Club.objects.filter(id=club_id).first() if club_id else None,
        metadata_json=json.dumps(metadata) if metadata else None,
    )


def record_editorial_action(
    *,
    content_type: str,
    object_id: int,
    from_status: str | None,
    to_status: str,
    actor_user: AppUser,
    club_id: int | None = None,
) -> None:
    EditorialAction.objects.create(
        content_type=content_type,
        object_id=object_id,
        from_status=from_status,
        to_status=to_status,
        actor_user=actor_user,
        actor_name=actor_user.name,
        club=Club.objects.filter(id=club_id).first() if club_id else None,
    )


def list_admin_audit_logs(
    *,
    club_id: int | None = None,
    action: str | None = None,
    content_type: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 20,
    limit: int | None = None,
) -> list[AdminAuditLogRecord]:
    queryset = AdminAuditLog.objects.all()
    if club_id:
        queryset = queryset.filter(club_id=club_id)
    if action:
        queryset = queryset.filter(action=action)
    if content_type:
        queryset = queryset.filter(content_type=content_type)
    if search:
        queryset = queryset.filter(summary__icontains=search)

    if limit is not None:
        queryset = queryset[:max(1, limit)]
    else:
        offset = (page - 1) * page_size
        queryset = queryset[offset:offset + page_size]

    return [
        AdminAuditLogRecord(
            id=log.id,
            action=log.action,
            content_type=log.content_type,
            object_id=log.object_id,
            summary=log.summary,
            actor_user_id=log.actor_user_id,
            actor_name=log.actor_name,
            club_id=log.club_id,
            metadata_json=log.metadata_json,
            created_at=log.created_at,
        )
        for log in queryset
    ]


def _activity_sort_key(item: AdminActivityLogRecord) -> datetime:
    value = item.created_at
    if value is None:
        return timezone.make_aware(datetime(1970, 1, 1))
    if timezone.is_naive(value):
        return timezone.make_aware(value)
    return value


def _audit_log_to_activity_record(log: AdminAuditLog) -> AdminActivityLogRecord:
    return AdminActivityLogRecord(
        source='audit',
        action=log.action,
        content_type=log.content_type,
        object_id=log.object_id,
        summary=log.summary,
        actor_user_id=log.actor_user_id,
        actor_name=log.actor_name,
        club_id=log.club_id,
        metadata_json=log.metadata_json,
        created_at=log.created_at,
    )


def _editorial_action_to_activity_record(action: EditorialAction) -> AdminActivityLogRecord:
    metadata = {
        'from_status': action.from_status,
        'to_status': action.to_status,
    }
    summary = (
        f'{action.content_type}: {action.from_status or "sem estado"} -> {action.to_status}'
    )
    return AdminActivityLogRecord(
        source='editorial',
        action='status_change',
        content_type=action.content_type,
        object_id=action.object_id,
        summary=summary,
        actor_user_id=action.actor_user_id,
        actor_name=action.actor_name,
        club_id=action.club_id,
        metadata_json=json.dumps(metadata),
        created_at=action.created_at,
    )


def list_admin_activity_logs(
    *,
    club_id: int | None = None,
    action: str | None = None,
    content_type: str | None = None,
    search: str | None = None,
    source: str | None = None,
    limit: int = 100,
) -> list[AdminActivityLogRecord]:
    if source and source not in {'audit', 'editorial'}:
        raise ValueError('Source de log invalida.')

    audit_queryset = AdminAuditLog.objects.all()
    editorial_queryset = EditorialAction.objects.all()

    if club_id is not None:
        audit_queryset = audit_queryset.filter(club_id=club_id)
        editorial_queryset = editorial_queryset.filter(club_id=club_id)
    if action:
        audit_queryset = audit_queryset.filter(action=action)
        if action == 'status_change':
            editorial_queryset = editorial_queryset.filter()
        else:
            editorial_queryset = editorial_queryset.filter(pk__in=[])
    if content_type:
        audit_queryset = audit_queryset.filter(content_type=content_type)
        editorial_queryset = editorial_queryset.filter(content_type=content_type)
    if search:
        audit_queryset = audit_queryset.filter(summary__icontains=search)

    activity_logs: list[AdminActivityLogRecord] = []
    if source in {None, 'audit'}:
        activity_logs.extend(_audit_log_to_activity_record(log) for log in audit_queryset)
    if source in {None, 'editorial'}:
        activity_logs.extend(_editorial_action_to_activity_record(log) for log in editorial_queryset)

    if search:
        lowered = search.lower()
        activity_logs = [
            log
            for log in activity_logs
            if lowered in log.summary.lower()
            or lowered in log.content_type.lower()
            or lowered in log.action.lower()
            or lowered in log.actor_name.lower()
        ]

    activity_logs.sort(key=_activity_sort_key, reverse=True)
    return activity_logs[:max(1, limit)]


def list_editorial_history(*, content_type: str, object_id: int) -> list[EditorialHistoryRecord]:
    queryset = EditorialAction.objects.filter(content_type=content_type, object_id=object_id)
    return [
        EditorialHistoryRecord(
            content_type=action.content_type,
            object_id=action.object_id,
            from_status=action.from_status,
            to_status=action.to_status,
            actor_user_id=action.actor_user_id,
            actor_name=action.actor_name,
            created_at=action.created_at,
        )
        for action in queryset
    ]
