from __future__ import annotations

from dataclasses import dataclass
from datetime import date, datetime


class ClubRegistrationError(Exception):
    """Base service error for public club registrations."""


class DuplicateClubRegistrationError(ClubRegistrationError):
    """Raised when the same email is already registered for the same club."""


class ClubRegistrationRateLimitError(ClubRegistrationError):
    """Raised when the registration endpoint is being hit too often."""


class ClubRegistrationNotFoundError(ClubRegistrationError):
    """Raised when an admin-facing registration cannot be found in scope."""


class ActivityRegistrationError(Exception):
    """Base service error for event/session registrations."""


class DuplicateActivityRegistrationError(ActivityRegistrationError):
    """Raised when the same email is already registered for the same activity."""


class ActivityRegistrationRateLimitError(ActivityRegistrationError):
    """Raised when the registration endpoint is being hit too often."""


@dataclass(frozen=True, slots=True)
class ClubRegistrationInput:
    name: str
    email: str
    phone: str | None = None
    message: str | None = None


@dataclass(frozen=True, slots=True)
class AdminClubRegistrationRecord:
    registration_id: int
    club_id: int | None
    club_name: str
    registration_type: str
    target_title: str
    name: str
    email: str
    phone: str | None
    message: str | None
    status: str
    created_at: datetime | None


@dataclass(frozen=True, slots=True)
class AdminClubRegistrationPage:
    items: list[AdminClubRegistrationRecord]
    total: int
    page: int
    page_size: int
    total_pages: int


@dataclass(frozen=True, slots=True)
class AdminDashboardRecord:
    id: int
    title: str
    club_name: str | None
    date: datetime | None
    status: str | None = None


@dataclass(frozen=True, slots=True)
class EditorialHistoryRecord:
    content_type: str
    object_id: int
    from_status: str | None
    to_status: str
    actor_user_id: int | None
    actor_name: str
    created_at: datetime | None


@dataclass(frozen=True, slots=True)
class ActivityRegistrationSummary:
    confirmed_count: int
    waitlist_count: int
    remaining_slots: int | None
    registration_state: str


@dataclass(frozen=True, slots=True)
class AdminNotificationRecord:
    id: str
    kind: str
    level: str
    title: str
    message: str
    href: str
    created_at: datetime | None


@dataclass(frozen=True, slots=True)
class AdminAuditLogRecord:
    id: int
    action: str
    content_type: str
    object_id: int | None
    summary: str
    actor_user_id: int | None
    actor_name: str
    club_id: int | None
    metadata_json: str | None
    created_at: datetime | None


@dataclass(frozen=True, slots=True)
class AdminActivityLogRecord:
    source: str
    action: str
    content_type: str
    object_id: int | None
    summary: str
    actor_user_id: int | None
    actor_name: str
    club_id: int | None
    metadata_json: str | None
    created_at: datetime | None


@dataclass(frozen=True, slots=True)
class MetricSeriesPoint:
    label: str
    value: int
    period_start: date | datetime | None
    period_end: date | datetime | None


@dataclass(frozen=True, slots=True)
class MetricTopPageRecord:
    title: str
    page_path: str
    section: str
    views: int
    unique_visitors: int
    last_viewed_at: date | datetime | None


@dataclass(frozen=True, slots=True)
class MetricSectionBreakdownRecord:
    section: str
    views: int


@dataclass(frozen=True, slots=True)
class AdminMetricsOverview:
    period: str
    total_views: int
    unique_pages: int
    unique_visitors: int
    clubs_created: int
    news_created: int
    top_pages: list[MetricTopPageRecord]
    section_breakdown: list[MetricSectionBreakdownRecord]
    series: list[MetricSeriesPoint]
