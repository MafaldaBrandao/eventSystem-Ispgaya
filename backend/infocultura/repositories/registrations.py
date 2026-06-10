from __future__ import annotations

from datetime import datetime
from typing import Any

from email import encoders
from email.mime.base import MIMEBase
from django.conf import settings
from django.core.cache import cache
from django.core.mail import EmailMultiAlternatives
from django.db import transaction
from django.template.loader import render_to_string
from django.utils import timezone
from .email_assets import get_ispgaya_logo_path

from ..database import constants as db_constants
from ..models import AppUser, Club, Event, Registration, RegistrationStatus, Session
from ..service_types import (
    ActivityRegistrationError,
    ActivityRegistrationRateLimitError,
    ActivityRegistrationSummary,
    AdminClubRegistrationPage,
    AdminClubRegistrationRecord,
    ClubRegistrationInput,
    ClubRegistrationRateLimitError,
    DuplicateActivityRegistrationError,
    DuplicateClubRegistrationError,
)
from .audit import record_admin_audit_action
from .sql import execute_sql, fetch_all_dict_rows


def _normalized_email(value: str) -> str:
    return value.strip().lower()


def _clean_status(value: str | None) -> str:
    return (value or "").strip().lower()


def _format_dt(value: datetime | None) -> str:
    if value is None:
        return "Data por definir"

    localized = timezone.localtime(value) if timezone.is_aware(value) else value
    return localized.strftime("%d/%m/%Y %H:%M")


def _get_club_recipient_emails(*, club_id: int | None) -> list[str]:
    if club_id is None:
        return []

    return list(
        AppUser.objects.filter(club_id=club_id, is_active=True)
        .exclude(email__isnull=True)
        .exclude(email__exact="")
        .values_list("email", flat=True)
        .distinct()
    )


def _send_multipart_email(
    *,
    subject: str,
    template_name_prefix: str,
    context: dict[str, Any],
    recipient_list: list[str],
) -> None:
    if not recipient_list:
        return

    from_email = getattr(settings, "DEFAULT_FROM_EMAIL", "noreply@ispgaya.pt")
    logo_cid = "ispgaya-logo"

    full_context = {
        **context,
        "subject": subject,
        "from_name": _extract_sender_name(from_email),
        "from_email": _extract_sender_email(from_email),
        "logo_cid": logo_cid,
    }

    text_message = render_to_string(f"{template_name_prefix}.txt", full_context)
    html_message = render_to_string(f"{template_name_prefix}.html", full_context)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_message,
        from_email=from_email,
        to=recipient_list,
    )

    logo_path = get_ispgaya_logo_path()
    if logo_path is not None:
        image_part = MIMEBase("image", "svg+xml")
        image_part.set_payload(logo_path.read_bytes())
        encoders.encode_base64(image_part)
        image_part.add_header("Content-ID", f"<{logo_cid}>")
        image_part.add_header("Content-Disposition", "inline", filename=logo_path.name)
        message.attach(image_part)

    message.attach_alternative(html_message, "text/html")
    message.send(fail_silently=True)


def _extract_sender_name(value: str) -> str:
    cleaned = value.strip()
    if "<" in cleaned and ">" in cleaned:
        return cleaned.split("<", 1)[0].strip() or "InfoCultura"
    return "InfoCultura"


def _extract_sender_email(value: str) -> str:
    cleaned = value.strip()
    if "<" in cleaned and ">" in cleaned:
        return cleaned.split("<", 1)[1].split(">", 1)[0].strip()
    return cleaned


def _get_allowed_club_id(user) -> int | None:
    role_name = getattr(getattr(user, "role", None), "name", None)
    if role_name == "club_admin":
        return user.club_id
    return None


def _registration_rate_limit_key(*, club_id: int, client_ip: str) -> str:
    return f"infocultura:club_registration:{club_id}:{client_ip}"


def enforce_club_registration_rate_limit(*, club_id: int, client_ip: str | None) -> None:
    if not client_ip:
        return

    key = _registration_rate_limit_key(club_id=club_id, client_ip=client_ip)
    max_attempts = 3
    window_seconds = 15 * 60

    added = cache.add(key, 1, timeout=window_seconds)
    if added:
        return

    current_attempts = cache.get(key, 0)
    if current_attempts >= max_attempts:
        raise ClubRegistrationRateLimitError(
            "Demasiadas tentativas de inscricao. Tenta novamente dentro de alguns minutos."
        )

    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, current_attempts + 1, timeout=window_seconds)


def _activity_registration_rate_limit_key(*, activity_type: str, activity_id: int, client_ip: str) -> str:
    return f"infocultura:{activity_type}_registration:{activity_id}:{client_ip}"


def enforce_activity_registration_rate_limit(
    *,
    activity_type: str,
    activity_id: int,
    client_ip: str | None,
) -> None:
    if not client_ip:
        return

    key = _activity_registration_rate_limit_key(
        activity_type=activity_type,
        activity_id=activity_id,
        client_ip=client_ip,
    )
    max_attempts = 3
    window_seconds = 15 * 60

    added = cache.add(key, 1, timeout=window_seconds)
    if added:
        return

    current_attempts = cache.get(key, 0)
    if current_attempts >= max_attempts:
        raise ActivityRegistrationRateLimitError(
            "Demasiadas tentativas de inscricao. Tenta novamente dentro de alguns minutos."
        )

    try:
        cache.incr(key)
    except ValueError:
        cache.set(key, current_attempts + 1, timeout=window_seconds)


def _build_registration_exists_sql(*, link_table: str, activity_id_field: str, alias: str) -> str:
    return f"""
        SELECT 1
        FROM {link_table} {alias}
        INNER JOIN {db_constants.TABLE_REGISTRATION} r
            ON r.{db_constants.COL_ID_REGISTRATIONS} = {alias}.{db_constants.COL_ID_REGISTRATIONS}
        WHERE {alias}.{activity_id_field} = %s
          AND LOWER(r.email) = %s
        LIMIT 1
    """


def club_registration_exists(*, club_id: int, email: str) -> bool:
    normalized_email = _normalized_email(email)
    sql = _build_registration_exists_sql(
        link_table=db_constants.TABLE_CLUB_REGISTRATION,
        activity_id_field=db_constants.COL_ID_CLUBS,
        alias="cr",
    )
    return bool(fetch_all_dict_rows(sql, (club_id, normalized_email)))


def event_registration_exists(*, event_id: int, email: str) -> bool:
    normalized_email = _normalized_email(email)
    sql = _build_registration_exists_sql(
        link_table=db_constants.TABLE_EVENT_REGISTRATION,
        activity_id_field=db_constants.COL_ID_EVENT,
        alias="er",
    )
    return bool(fetch_all_dict_rows(sql, (event_id, normalized_email)))


def session_registration_exists(*, session_id: int, email: str) -> bool:
    normalized_email = _normalized_email(email)
    sql = _build_registration_exists_sql(
        link_table=db_constants.TABLE_SESSION_REGISTRATION,
        activity_id_field=db_constants.COL_ID_SESSIONS,
        alias="sr",
    )
    return bool(fetch_all_dict_rows(sql, (session_id, normalized_email)))


def _normalize_capacity(value: int | None) -> int | None:
    if value is None:
        return None
    return max(0, int(value))


def _build_activity_registration_summary(
    *,
    link_table: str,
    activity_id_field: str,
    activity_id: int,
    capacity: int | None,
    registrations_enabled: bool,
    is_open_by_date: bool,
) -> ActivityRegistrationSummary:
    sql = f"""
        SELECT LOWER(COALESCE(rs.name, r.status)) AS resolved_status, COUNT(*) AS total_count
        FROM {link_table} link
        INNER JOIN {db_constants.TABLE_REGISTRATION} r
            ON r.{db_constants.COL_ID_REGISTRATIONS} = link.{db_constants.COL_ID_REGISTRATIONS}
        LEFT JOIN {db_constants.TABLE_REGISTRATION_STATUS} rs
            ON rs.{db_constants.COL_ID_RSTATUS} = r.{db_constants.COL_ID_RSTATUS}
        WHERE link.{activity_id_field} = %s
        GROUP BY LOWER(COALESCE(rs.name, r.status))
    """
    stats = fetch_all_dict_rows(sql, (activity_id,))

    confirmed_count = 0
    waitlist_count = 0

    for entry in stats:
        normalized_status = _clean_status(entry['resolved_status'])
        if normalized_status in {"confirmed", "approved"}:
            confirmed_count += int(entry["total_count"])
        elif normalized_status == "waitlist":
            waitlist_count += int(entry["total_count"])

    normalized_capacity = _normalize_capacity(capacity)
    remaining_slots = None if normalized_capacity is None else max(0, normalized_capacity - confirmed_count)

    if not registrations_enabled or not is_open_by_date:
        registration_state = "closed"
    elif normalized_capacity is not None and confirmed_count >= normalized_capacity:
        registration_state = "waitlist"
    else:
        registration_state = "open"

    return ActivityRegistrationSummary(
        confirmed_count=confirmed_count,
        waitlist_count=waitlist_count,
        remaining_slots=remaining_slots,
        registration_state=registration_state,
    )


def get_event_registration_summary(*, event: Event) -> ActivityRegistrationSummary:
    return _build_activity_registration_summary(
        link_table=db_constants.TABLE_EVENT_REGISTRATION,
        activity_id_field=db_constants.COL_ID_EVENT,
        activity_id=event.id,
        capacity=event.registration_capacity,
        registrations_enabled=bool(event.enable_registrations),
        is_open_by_date=event.end_date >= timezone.now(),
    )


def get_session_registration_summary(*, session: Session) -> ActivityRegistrationSummary:
    return _build_activity_registration_summary(
        link_table=db_constants.TABLE_SESSION_REGISTRATION,
        activity_id_field=db_constants.COL_ID_SESSIONS,
        activity_id=session.id,
        capacity=session.registration_capacity,
        registrations_enabled=bool(session.enable_registrations),
        is_open_by_date=session.end_date >= timezone.now(),
    )


def create_club_registration(
    *,
    club: Club,
    payload: ClubRegistrationInput,
    client_ip: str | None = None,
) -> Registration:
    enforce_club_registration_rate_limit(club_id=club.id, client_ip=client_ip)

    if club_registration_exists(club_id=club.id, email=payload.email):
        raise DuplicateClubRegistrationError(
            "Ja existe uma inscricao submetida com este email para este clube."
        )

    with transaction.atomic():
        registration = Registration.objects.create(
            name=payload.name.strip(),
            email=payload.email.strip(),
            phone=(payload.phone or "").strip() or None,
            message=(payload.message or "").strip() or None,
            status="pending",
            created_at=timezone.now(),
        )
        execute_sql(
            f"""
                INSERT INTO {db_constants.TABLE_CLUB_REGISTRATION} (
                    {db_constants.COL_ID_CLUBS},
                    {db_constants.COL_ID_REGISTRATIONS}
                ) VALUES (%s, %s)
            """,
            (club.id, registration.id),
        )

    notify_new_club_registration(club=club, registration=registration)
    record_admin_audit_action(
        action='create',
        content_type='registration',
        object_id=registration.id,
        summary=f'Nova inscricao no clube {club.name}',
        actor_user=None,
        actor_name='Visitante',
        club_id=club.id,
        metadata={
            'registration_type': 'club',
            'email': registration.email,
        },
    )
    return registration


def _admin_registration_scope_sql() -> str:
    return f"""
        SELECT
            cr.{db_constants.COL_ID_REGISTRATIONS} AS registration_id,
            cr.{db_constants.COL_ID_CLUBS} AS club_id,
            c.name AS club_name,
            'club' AS registration_type,
            c.name AS target_title
        FROM {db_constants.TABLE_CLUB_REGISTRATION} cr
        INNER JOIN {db_constants.TABLE_CLUB} c
            ON c.{db_constants.COL_ID_CLUBS} = cr.{db_constants.COL_ID_CLUBS}

        UNION ALL

        SELECT
            er.{db_constants.COL_ID_REGISTRATIONS} AS registration_id,
            u.{db_constants.COL_ID_CLUBS} AS club_id,
            c.name AS club_name,
            'event' AS registration_type,
            e.title AS target_title
        FROM {db_constants.TABLE_EVENT_REGISTRATION} er
        INNER JOIN {db_constants.TABLE_EVENT} e
            ON e.{db_constants.COL_ID_EVENT} = er.{db_constants.COL_ID_EVENT}
        LEFT JOIN {db_constants.TABLE_USER} u
            ON u.id = e.{db_constants.COL_USER_ID}
        LEFT JOIN {db_constants.TABLE_CLUB} c
            ON c.{db_constants.COL_ID_CLUBS} = u.{db_constants.COL_ID_CLUBS}

        UNION ALL

        SELECT
            sr.{db_constants.COL_ID_REGISTRATIONS} AS registration_id,
            s.{db_constants.COL_CLUB_ID} AS club_id,
            c.name AS club_name,
            'session' AS registration_type,
            s.title AS target_title
        FROM {db_constants.TABLE_SESSION_REGISTRATION} sr
        INNER JOIN {db_constants.TABLE_SESSION} s
            ON s.{db_constants.COL_ID_SESSIONS} = sr.{db_constants.COL_ID_SESSIONS}
        LEFT JOIN {db_constants.TABLE_CLUB} c
            ON c.{db_constants.COL_ID_CLUBS} = s.{db_constants.COL_CLUB_ID}
    """


def _admin_registration_joins() -> str:
    return "\n".join(
        [
            f"FROM ({_admin_registration_scope_sql()}) ar",
            f"INNER JOIN {db_constants.TABLE_REGISTRATION} r ON r.{db_constants.COL_ID_REGISTRATIONS} = ar.registration_id",
            f"LEFT JOIN {db_constants.TABLE_REGISTRATION_STATUS} rs ON rs.{db_constants.COL_ID_RSTATUS} = r.{db_constants.COL_ID_RSTATUS}",
        ]
    )


def _build_admin_registration_select_sql(*, joins: str, where_sql: str, order_by: str) -> str:
    return f"""
        SELECT
            r.{db_constants.COL_ID_REGISTRATIONS} AS registration_id,
            ar.club_id,
            COALESCE(ar.club_name, 'Sem clube') AS club_name,
            ar.registration_type,
            ar.target_title,
            r.name,
            r.email,
            r.phone,
            r.message,
            COALESCE(rs.name, r.status) AS status,
            r.created_at
        {joins}
        {where_sql}
        ORDER BY {order_by}
    """


def _row_to_admin_club_registration_record(row: dict[str, Any]) -> AdminClubRegistrationRecord:
    return AdminClubRegistrationRecord(
        registration_id=row["registration_id"],
        club_id=row["club_id"],
        club_name=row["club_name"],
        registration_type=row["registration_type"],
        target_title=row["target_title"],
        name=row["name"],
        email=row["email"],
        phone=row["phone"],
        message=row["message"],
        status=row["status"],
        created_at=row["created_at"],
    )


def _build_activity_registration_subject(*, label: str, activity_title: str, status: str) -> str:
    if status == "waitlist":
        return f"Lista de espera na {label} {activity_title}"
    return f"Inscricao confirmada na {label} {activity_title}"


def _build_activity_registration_body(
    *,
    attendee_name: str,
    label: str,
    activity_title: str,
    club_name: str,
    location: str,
    start_date: datetime,
    status: str,
) -> str:
    if status == "waitlist":
        decision_line = "A tua inscricao ficou em lista de espera."
    else:
        decision_line = "A tua inscricao foi confirmada automaticamente."

    lines = [
        f"Ola {attendee_name},",
        "",
        decision_line,
        f"{label}: {activity_title}",
        f"Clube: {club_name}",
        f"Data: {_format_dt(start_date)}",
        f"Local: {location or 'Local por definir'}",
        "",
        "Obrigado pelo teu interesse.",
        "InfoCultura",
    ]
    return "\n".join(lines)


def _build_admin_registration_notification_body(
    *,
    attendee_name: str,
    attendee_email: str,
    phone: str | None,
    message: str | None,
    scope_label: str,
) -> str:
    lines = [
        "Foi recebida uma nova inscricao.",
        "",
        f"Destino: {scope_label}",
        f"Nome: {attendee_name}",
        f"Email: {attendee_email}",
        f"Telefone: {phone or 'Sem telefone'}",
        f"Mensagem: {message or 'Sem mensagem adicional'}",
        "",
        "InfoCultura",
    ]
    return "\n".join(lines)


def notify_new_club_registration(*, club: Club, registration: Registration) -> None:
    recipients = _get_club_recipient_emails(club_id=club.id)
    _send_multipart_email(
        subject=f"Nova inscricao no clube {club.name}",
        template_name_prefix="emails/registrations/admin_registration_notification",
        context={
            "attendee_name": registration.name,
            "attendee_email": registration.email,
            "phone": registration.phone,
            "message": registration.message,
            "scope_label": club.name,
        },
        recipient_list=recipients,
    )


def notify_new_activity_registration(
    *,
    club_id: int | None,
    activity_label: str,
    activity_title: str,
    registration: Registration,
) -> None:
    recipients = _get_club_recipient_emails(club_id=club_id)
    _send_multipart_email(
        subject=f"Nova inscricao em {activity_label.lower()}: {activity_title}",
        template_name_prefix="emails/registrations/admin_registration_notification",
        context={
            "attendee_name": registration.name,
            "attendee_email": registration.email,
            "phone": registration.phone,
            "message": registration.message,
            "scope_label": f"{activity_label} {activity_title}",
        },
        recipient_list=recipients,
    )


def send_activity_registration_email(
    *,
    recipient_email: str,
    attendee_name: str,
    label: str,
    activity_title: str,
    club_name: str,
    location: str,
    start_date: datetime,
    status: str,
) -> None:
    subject = _build_activity_registration_subject(
        label=label,
        activity_title=activity_title,
        status=status,
    )
    _send_multipart_email(
        subject=subject,
        template_name_prefix="emails/registrations/activity_registration",
        context={
            "attendee_name": attendee_name,
            "label": label,
            "activity_title": activity_title,
            "club_name": club_name,
            "location": location or "Local por definir",
            "start_date_str": _format_dt(start_date),
            "status": status,
        },
        recipient_list=[recipient_email],
    )


def _create_activity_registration(
    *,
    activity_type: str,
    activity_id: int,
    activity_label: str,
    activity_title: str,
    club_id: int | None,
    club_name: str,
    location: str,
    start_date: datetime,
    registrations_enabled: bool,
    registration_capacity: int | None,
    is_open_by_date: bool,
    payload: ClubRegistrationInput,
    client_ip: str | None,
    exists_fn,
    summary_fn,
) -> Registration:
    if not registrations_enabled or not is_open_by_date:
        raise ActivityRegistrationError("As inscricoes para esta atividade estao encerradas.")

    enforce_activity_registration_rate_limit(
        activity_type=activity_type,
        activity_id=activity_id,
        client_ip=client_ip,
    )

    if exists_fn(activity_id=activity_id, email=payload.email):
        raise DuplicateActivityRegistrationError(
            "Ja existe uma inscricao submetida com este email para esta atividade."
        )

    summary = summary_fn()
    registration_status = "confirmed"
    normalized_capacity = _normalize_capacity(registration_capacity)
    if normalized_capacity is not None and summary.confirmed_count >= normalized_capacity:
        registration_status = "waitlist"

    with transaction.atomic():
        registration = Registration.objects.create(
            name=payload.name.strip(),
            email=payload.email.strip(),
            phone=(payload.phone or "").strip() or None,
            message=(payload.message or "").strip() or None,
            status=registration_status,
            created_at=timezone.now(),
        )

        if activity_type == "event":
            link_table = db_constants.TABLE_EVENT_REGISTRATION
            activity_column = db_constants.COL_ID_EVENT
        else:
            link_table = db_constants.TABLE_SESSION_REGISTRATION
            activity_column = db_constants.COL_ID_SESSIONS

        execute_sql(
            f"""
                INSERT INTO {link_table} (
                    {activity_column},
                    {db_constants.COL_ID_REGISTRATIONS},
                    created_at
                ) VALUES (%s, %s, %s)
            """,
            (activity_id, registration.id, timezone.now()),
        )

    send_activity_registration_email(
        recipient_email=registration.email,
        attendee_name=registration.name,
        label=activity_label,
        activity_title=activity_title,
        club_name=club_name,
        location=location,
        start_date=start_date,
        status=registration_status,
    )
    notify_new_activity_registration(
        club_id=club_id,
        activity_label=activity_label,
        activity_title=activity_title,
        registration=registration,
    )
    record_admin_audit_action(
        action='create',
        content_type='registration',
        object_id=registration.id,
        summary=f'Nova inscricao em {activity_label.lower()}: {activity_title}',
        actor_user=None,
        actor_name='Visitante',
        club_id=club_id,
        metadata={
            'registration_type': activity_type,
            'activity_label': activity_label,
            'activity_title': activity_title,
            'status': registration_status,
            'email': registration.email,
        },
    )
    return registration


def create_event_registration(
    *,
    event: Event,
    payload: ClubRegistrationInput,
    client_ip: str | None = None,
) -> Registration:
    return _create_activity_registration(
        activity_type="event",
        activity_id=event.id,
        activity_label="Evento",
        activity_title=event.title,
        club_id=event.club_id,
        club_name=event.club_name or "Clube sem nome",
        location=event.location or event.city or "Local por definir",
        start_date=event.start_date,
        registrations_enabled=bool(event.enable_registrations),
        registration_capacity=event.registration_capacity,
        is_open_by_date=event.end_date >= timezone.now(),
        payload=payload,
        client_ip=client_ip,
        exists_fn=lambda activity_id, email: event_registration_exists(event_id=activity_id, email=email),
        summary_fn=lambda: get_event_registration_summary(event=event),
    )


def create_session_registration(
    *,
    session: Session,
    payload: ClubRegistrationInput,
    client_ip: str | None = None,
) -> Registration:
    return _create_activity_registration(
        activity_type="session",
        activity_id=session.id,
        activity_label="Sessao",
        activity_title=session.title,
        club_id=session.club_id,
        club_name=session.club.name if session.club_id and session.club else "Clube sem nome",
        location=session.location or session.title,
        start_date=session.start_date,
        registrations_enabled=bool(session.enable_registrations),
        registration_capacity=session.registration_capacity,
        is_open_by_date=session.end_date >= timezone.now(),
        payload=payload,
        client_ip=client_ip,
        exists_fn=lambda activity_id, email: session_registration_exists(session_id=activity_id, email=email),
        summary_fn=lambda: get_session_registration_summary(session=session),
    )


def list_admin_club_registrations(
    *,
    club_id: int | None = None,
    status: str | None = None,
    search: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    allowed_club_id: int | None = None,
    page: int = 1,
    page_size: int = 10,
    ordering: str | None = None,
    export_all: bool = False,
) -> AdminClubRegistrationPage:
    joins = _admin_registration_joins()
    filters = ["1=1"]
    params: list[Any] = []

    if allowed_club_id is not None:
        filters.append("ar.club_id = %s")
        params.append(allowed_club_id)
    if club_id is not None:
        filters.append("ar.club_id = %s")
        params.append(club_id)
    if status:
        filters.append("LOWER(COALESCE(rs.name, r.status)) = LOWER(%s)")
        params.append(status)
    if search:
        filters.append("(LOWER(r.name) LIKE %s OR LOWER(r.email) LIKE %s)")
        search_term = f"%{search.lower()}%"
        params.extend([search_term, search_term])
    if date_from:
        filters.append("DATE(r.created_at) >= %s")
        params.append(date_from)
    if date_to:
        filters.append("DATE(r.created_at) <= %s")
        params.append(date_to)

    ordering_map = {
        "newest": "r.created_at DESC",
        "oldest": "r.created_at ASC",
        "name_asc": "r.name ASC",
        "name_desc": "r.name DESC",
        "email_asc": "r.email ASC",
        "email_desc": "r.email DESC",
        "club_asc": "ar.club_name ASC",
        "club_desc": "ar.club_name DESC",
    }
    order_by = ordering_map.get(ordering, "r.created_at DESC")
    where_sql = "WHERE " + " AND ".join(filters)
    count_sql = f"SELECT COUNT(*) AS total_count {joins}\n{where_sql}"
    total_rows = fetch_all_dict_rows(count_sql, params)
    total = int(total_rows[0]["total_count"]) if total_rows else 0

    select_sql = _build_admin_registration_select_sql(joins=joins, where_sql=where_sql, order_by=order_by)
    query_params = list(params)
    if not export_all:
        offset = (page - 1) * page_size
        select_sql += " LIMIT %s OFFSET %s"
        query_params.extend([page_size, offset])

    rows = fetch_all_dict_rows(select_sql, tuple(query_params))
    items = [
        _row_to_admin_club_registration_record(row)
        for row in rows
    ]

    total_pages = (total + page_size - 1) // page_size if page_size and not export_all else 1

    return AdminClubRegistrationPage(
        items=items,
        total=total,
        page=page,
        page_size=page_size if not export_all else total,
        total_pages=total_pages,
    )


def get_admin_club_registration(
    *,
    registration_id: int,
    allowed_club_id: int | None = None,
) -> AdminClubRegistrationRecord | None:
    joins = _admin_registration_joins()
    sql = _build_admin_registration_select_sql(
        joins=joins,
        where_sql=f"WHERE r.{db_constants.COL_ID_REGISTRATIONS} = %s",
        order_by="r.created_at DESC",
    )
    params: list[Any] = [registration_id]
    if allowed_club_id is not None:
        sql = sql.replace(
            f"WHERE r.{db_constants.COL_ID_REGISTRATIONS} = %s",
            f"WHERE r.{db_constants.COL_ID_REGISTRATIONS} = %s AND ar.club_id = %s",
        )
        params.append(allowed_club_id)

    rows = fetch_all_dict_rows(sql, tuple(params))
    if not rows:
        return None
    return _row_to_admin_club_registration_record(rows[0])


def update_admin_club_registration_status(
    *,
    registration_id: int,
    registration_status: str,
    allowed_club_id: int | None = None,
) -> AdminClubRegistrationRecord | None:
    record = get_admin_club_registration(
        registration_id=registration_id,
        allowed_club_id=allowed_club_id,
    )
    if record is None:
        return None

    rstatus = RegistrationStatus.objects.filter(name__iexact=registration_status).first()
    update_kwargs = {"status": registration_status}
    if rstatus:
        update_kwargs["registration_status"] = rstatus

    Registration.objects.filter(id=registration_id).update(**update_kwargs)

    updated_record = get_admin_club_registration(
        registration_id=registration_id,
        allowed_club_id=allowed_club_id,
    )
    if updated_record:
        _send_multipart_email(
            subject=f"Inscricao atualizada em {updated_record.club_name}",
            template_name_prefix="emails/registrations/registration_status_update",
            context={
                "attendee_name": updated_record.name,
                "club_name": updated_record.club_name,
                "status": updated_record.status,
            },
            recipient_list=[updated_record.email],
        )
    return updated_record
