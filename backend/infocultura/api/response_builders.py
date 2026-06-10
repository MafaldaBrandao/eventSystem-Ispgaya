from __future__ import annotations

import csv
from dataclasses import dataclass
from datetime import datetime, timezone as dt_timezone
from typing import Any, Iterable, Mapping, Sequence, Type

from django.core.paginator import Paginator
from django.db.models import QuerySet
from django.http import HttpResponse
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.serializers import BaseSerializer


@dataclass(frozen=True, slots=True)
class PaginationParams:
    page: int = 1
    page_size: int = 10

    @classmethod
    def from_query_params(
        cls,
        query_params: Mapping[str, Any],
        *,
        default_page_size: int = 10,
        max_page_size: int = 100,
    ) -> "PaginationParams":
        page = _read_positive_int(query_params.get("page"), default=1)
        page_size = _read_positive_int(query_params.get("page_size"), default=default_page_size)
        return cls(page=page, page_size=min(page_size, max_page_size))


@dataclass(frozen=True, slots=True)
class DateRangeParams:
    date_from: str | None = None
    date_to: str | None = None

    @classmethod
    def from_query_params(cls, query_params: Mapping[str, Any]) -> "DateRangeParams":
        date_from = _clean_optional_string(query_params.get("date_from"))
        date_to = _clean_optional_string(query_params.get("date_to"))
        return cls(date_from=date_from, date_to=date_to)


@dataclass(frozen=True, slots=True)
class CsvExport:
    headers: Sequence[str]
    rows: Iterable[Sequence[Any]]
    filename: str

    def to_response(self) -> HttpResponse:
        response = HttpResponse(content_type="text/csv; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{self.filename}"'
        writer = csv.writer(response)
        writer.writerow(self.headers)
        writer.writerows(self.rows)
        return response


@dataclass(frozen=True, slots=True)
class CalendarIcsEvent:
    uid: str
    title: str
    description: str
    start_date: datetime
    end_date: datetime
    location: str
    filename: str

    def to_response(self) -> HttpResponse:
        content = "\r\n".join(
            [
                "BEGIN:VCALENDAR",
                "VERSION:2.0",
                "PRODID:-//ISPGAYA//InfoCultura//PT",
                "CALSCALE:GREGORIAN",
                "BEGIN:VEVENT",
                f"UID:{self.uid}",
                f"DTSTAMP:{_format_ics_datetime(timezone.now())}",
                f"DTSTART:{_format_ics_datetime(self.start_date)}",
                f"DTEND:{_format_ics_datetime(self.end_date)}",
                f"SUMMARY:{_escape_ics_text(self.title)}",
                f"DESCRIPTION:{_escape_ics_text(self.description)}",
                f"LOCATION:{_escape_ics_text(self.location)}",
                "END:VEVENT",
                "END:VCALENDAR",
                "",
            ]
        )
        response = HttpResponse(content, content_type="text/calendar; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="{self.filename}"'
        return response


def paginate_queryset(
    queryset: QuerySet[Any],
    *,
    request: Any,
    serializer_class: Type[BaseSerializer],
    context: dict[str, Any] | None = None,
) -> Response:
    pagination = PaginationParams.from_query_params(request.query_params)
    paginator = Paginator(queryset, pagination.page_size)
    page_obj = paginator.get_page(pagination.page)
    serializer = serializer_class(page_obj.object_list, many=True, context=context or {})
    return Response(
        {
            "items": serializer.data,
            "total": paginator.count,
            "page": page_obj.number,
            "page_size": pagination.page_size,
            "total_pages": paginator.num_pages,
        }
    )


def apply_date_range_filters(
    queryset: QuerySet[Any],
    request: Any,
    *,
    date_field: str,
) -> QuerySet[Any]:
    date_range = DateRangeParams.from_query_params(request.query_params)

    if date_range.date_from:
        queryset = queryset.filter(**{f"{date_field}__gte": date_range.date_from})
    if date_range.date_to:
        queryset = queryset.filter(**{f"{date_field}__lte": date_range.date_to})

    return queryset


def apply_admin_ordering(
    queryset: QuerySet[Any],
    request: Any,
    *,
    default_ordering: tuple[str, ...],
    ordering_map: dict[str, tuple[str, ...]],
) -> QuerySet[Any]:
    ordering_key = (request.query_params.get("ordering") or "").strip().lower()
    ordering = ordering_map.get(ordering_key, default_ordering)
    return queryset.order_by(*ordering)


def build_csv_response(
    *,
    rows: Iterable[Sequence[Any]],
    headers: Sequence[str],
    filename: str,
) -> HttpResponse:
    return CsvExport(headers=headers, rows=rows, filename=filename).to_response()


def build_calendar_ics_response(
    *,
    uid_prefix: str,
    title: str,
    description: str,
    start_date: datetime,
    end_date: datetime,
    location: str,
    filename: str,
) -> HttpResponse:
    return CalendarIcsEvent(
        uid=uid_prefix,
        title=title,
        description=description,
        start_date=start_date,
        end_date=end_date,
        location=location,
        filename=filename,
    ).to_response()


def _read_positive_int(value: Any, *, default: int) -> int:
    try:
        return max(1, int(value))
    except (TypeError, ValueError):
        return default


def _clean_optional_string(value: Any) -> str | None:
    cleaned = (value or "").strip()
    return cleaned or None


def _format_ics_datetime(value: datetime) -> str:
    if timezone.is_naive(value):
        value = timezone.make_aware(value, timezone.get_current_timezone())
    return timezone.localtime(value, dt_timezone.utc).strftime("%Y%m%dT%H%M%SZ")


def _escape_ics_text(value: str) -> str:
    return (
        (value or "")
        .replace("\\", "\\\\")
        .replace(";", r"\;")
        .replace(",", r"\,")
        .replace("\n", r"\n")
    )
