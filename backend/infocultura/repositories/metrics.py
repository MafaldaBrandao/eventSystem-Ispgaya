from __future__ import annotations

import calendar
from datetime import date, datetime, timedelta

from django.db.models import Count, Max, Q
from django.db.models.functions import TruncDate
from django.utils import timezone

from ..models import Club, MetricView, News
from ..service_types import (
    AdminMetricsOverview,
    MetricSectionBreakdownRecord,
    MetricSeriesPoint,
    MetricTopPageRecord,
)

_PERIODS = {'day', 'week', 'month'}


def _start_of_day(value: datetime) -> datetime:
    local_date = timezone.localdate(value)
    return timezone.make_aware(datetime(local_date.year, local_date.month, local_date.day))


def _start_of_week(value: datetime) -> datetime:
    local_date = timezone.localdate(value)
    monday = local_date - timedelta(days=local_date.weekday())
    return timezone.make_aware(datetime(monday.year, monday.month, monday.day))


def _start_of_month(value: datetime) -> datetime:
    local_date = timezone.localdate(value)
    return timezone.make_aware(datetime(local_date.year, local_date.month, 1))


def _month_step(value: date, offset: int) -> date:
    month_index = (value.year * 12 + (value.month - 1)) + offset
    year = month_index // 12
    month = month_index % 12 + 1
    return date(year, month, 1)


def _format_day_label(value: date) -> str:
    return value.strftime('%d/%m')


def _format_week_label(value: date) -> str:
    return f"Semana {value.strftime('%d/%m')}"


def _format_month_label(value: date) -> str:
    month_name = calendar.month_name[value.month]
    return f"{month_name} {value.year}"


def _build_series(period: str, counts: dict[date, int], now: datetime) -> list[MetricSeriesPoint]:
    points: list[MetricSeriesPoint] = []

    if period == 'day':
        today = timezone.localdate(now)
        start_day = today - timedelta(days=13)
        for index in range(14):
            current = start_day + timedelta(days=index)
            points.append(
                MetricSeriesPoint(
                    label=_format_day_label(current),
                    value=counts.get(current, 0),
                    period_start=current,
                    period_end=current,
                )
            )
        return points

    if period == 'week':
        current_week = timezone.localdate(now)
        start_week = current_week - timedelta(days=current_week.weekday() + (11 * 7))
        for index in range(12):
            current = start_week + timedelta(weeks=index)
            points.append(
                MetricSeriesPoint(
                    label=_format_week_label(current),
                    value=counts.get(current, 0),
                    period_start=current,
                    period_end=current + timedelta(days=6),
                )
            )
        return points

    current_month = timezone.localdate(now).replace(day=1)
    start_month = _month_step(current_month, -11)
    for index in range(12):
        current = _month_step(start_month, index)
        points.append(
            MetricSeriesPoint(
                label=_format_month_label(current),
                value=counts.get(current, 0),
                period_start=current,
                period_end=date(
                    current.year,
                    current.month,
                    calendar.monthrange(current.year, current.month)[1],
                ),
            )
        )
    return points


def _normalize_week_start(value: date) -> date:
    return value - timedelta(days=value.weekday())


def _normalize_month_start(value: date) -> date:
    return value.replace(day=1)


def _period_start(period: str, now: datetime) -> datetime:
    if period == 'day':
        return _start_of_day(now) - timedelta(days=13)
    if period == 'week':
        return _start_of_week(now) - timedelta(weeks=11)
    return _start_of_month(now)


def get_admin_metrics_overview(*, user, period: str = 'week', limit: int = 8) -> AdminMetricsOverview:
    if period not in _PERIODS:
        raise ValueError('Periodo de metricas invalido.')

    now = timezone.now()
    start = _period_start(period, now)

    queryset = MetricView.objects.filter(viewed_at__gte=start)

    total_views = queryset.count()
    unique_pages = queryset.values('page_path').distinct().count()
    unique_visitors = queryset.exclude(visitor_key='').values('visitor_key').distinct().count()
    clubs_created = Club.objects.filter(created_at__gte=start).count()
    news_created = News.objects.filter(created_at__gte=start).count()

    grouped_rows = (
        queryset.annotate(bucket=TruncDate('viewed_at', tzinfo=None))
        .values('bucket')
        .annotate(views=Count('id'))
        .order_by('bucket')
    )

    count_map: dict[date, int] = {}
    for row in grouped_rows:
        bucket_value = row['bucket']
        if bucket_value is None:
            continue

        if period == 'day':
            bucket_date = bucket_value
        elif period == 'week':
            bucket_date = _normalize_week_start(bucket_value)
        else:
            bucket_date = _normalize_month_start(bucket_value)

        count_map[bucket_date] = count_map.get(bucket_date, 0) + row['views']

    series = _build_series(period, count_map, now)

    top_pages = [
        MetricTopPageRecord(
            title=row['title'] or row['page_path'],
            page_path=row['page_path'],
            section=row['section'],
            views=row['views'],
            unique_visitors=row['unique_visitors'],
            last_viewed_at=row['last_viewed_at'],
        )
        for row in queryset.values('title', 'page_path', 'section')
        .annotate(
            views=Count('id'),
            unique_visitors=Count('visitor_key', distinct=True, filter=~Q(visitor_key='')),
            last_viewed_at=Max('viewed_at'),
        )
        .order_by('-views', '-last_viewed_at')[:limit]
    ]

    section_breakdown = [
        MetricSectionBreakdownRecord(section=row['section'], views=row['views'])
        for row in queryset.values('section')
        .annotate(views=Count('id'))
        .order_by('-views')
    ]

    return AdminMetricsOverview(
        period=period,
        total_views=total_views,
        unique_pages=unique_pages,
        unique_visitors=unique_visitors,
        clubs_created=clubs_created,
        news_created=news_created,
        top_pages=top_pages,
        section_breakdown=section_breakdown,
        series=series,
    )


def record_metric_view(*, payload: dict[str, object]) -> MetricView:
    return MetricView.objects.create(**payload)
