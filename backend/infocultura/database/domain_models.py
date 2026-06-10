from __future__ import annotations

from dataclasses import dataclass, field
from datetime import date, datetime
from enum import Enum
from typing import Optional


def _require_positive_int(value: int, field_name: str) -> None:
    if value <= 0:
        raise ValueError(f"{field_name} must be a positive integer.")


def _require_non_empty(value: str, field_name: str) -> None:
    if not value or not value.strip():
        raise ValueError(f"{field_name} is required.")


def _require_email(value: str, field_name: str = "email") -> None:
    _require_non_empty(value, field_name)
    if "@" not in value or value.startswith("@") or value.endswith("@"):
        raise ValueError(f"{field_name} must be a valid email address.")


def _require_datetime(value: datetime, field_name: str) -> None:
    if not isinstance(value, datetime):
        raise TypeError(f"{field_name} must be a datetime instance.")


def _require_date(value: date, field_name: str) -> None:
    if not isinstance(value, date):
        raise TypeError(f"{field_name} must be a date instance.")


def _require_chronological(start_value: datetime, end_value: datetime) -> None:
    if end_value < start_value:
        raise ValueError("end_date must be greater than or equal to start_date.")


class EventStatus(str, Enum):
    """Optional enum suggestion for EVENT.status values."""

    DRAFT = "draft"
    PUBLISHED = "published"
    CANCELLED = "cancelled"
    ARCHIVED = "archived"


class NewsletterStatus(str, Enum):
    """Optional enum suggestion for NEWSLETTERS.status values."""

    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    CANCELLED = "cancelled"


@dataclass(slots=True, kw_only=True)
class CreatedAtMixin:
    """Reusable base for tables that only expose `created_at`."""

    created_at: datetime

    def __post_init__(self) -> None:
        _require_datetime(self.created_at, "created_at")


@dataclass(slots=True, kw_only=True)
class AuditMixin(CreatedAtMixin):
    """Reusable base for tables that expose `created_at` and `updated_at`."""

    updated_at: datetime

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_datetime(self.updated_at, "updated_at")
        if self.updated_at < self.created_at:
            raise ValueError("updated_at must be greater than or equal to created_at.")


@dataclass(slots=True, kw_only=True)
class Role:
    """Table ROLE. Corresponds to `id_role`, `name`, `description`."""

    role_id: int
    name: str
    description: str = ""

    users: list[User] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        _require_positive_int(self.role_id, "role_id")
        _require_non_empty(self.name, "name")


@dataclass(slots=True, kw_only=True)
class NewsStatus:
    """Table NSTATUS. Corresponds to `id_nstatus`, `name`, `description`."""

    news_status_id: int
    name: str
    description: str = ""

    news_items: list[News] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        _require_positive_int(self.news_status_id, "news_status_id")
        _require_non_empty(self.name, "name")


@dataclass(slots=True, kw_only=True)
class RegistrationStatus:
    """Table RSTATUS. Corresponds to `id_rstatus`, `name`, `description`."""

    registration_status_id: int
    name: str
    description: str = ""

    registrations: list[Registration] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        _require_positive_int(self.registration_status_id, "registration_status_id")
        _require_non_empty(self.name, "name")


@dataclass(slots=True, kw_only=True)
class Club(CreatedAtMixin):
    """Table CLUBS. Corresponds to `id_clubs` and club-level settings."""

    club_id: int
    name: str
    description: str = ""
    mission: str = ""
    is_active: bool = True
    enable_registrations: bool = True

    members: list[User] = field(default_factory=list, repr=False)
    books: list[Book] = field(default_factory=list, repr=False)
    sessions: list[Session] = field(default_factory=list, repr=False)
    registrations: list[Registration] = field(default_factory=list, repr=False)
    registration_links: list[ClubRegistration] = field(default_factory=list, repr=False)
    news_items: list[News] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.club_id, "club_id")
        _require_non_empty(self.name, "name")


@dataclass(slots=True, kw_only=True)
class User(AuditMixin):
    """Table USER. Corresponds to `id_user`, `id_role`, `id_clubs` and user profile fields."""

    user_id: int
    name: str
    email: str
    password_hash: str
    is_active: bool

    role_id: int
    club_id: Optional[int] = None

    role: Optional[Role] = None
    club: Optional[Club] = None
    events: list[Event] = field(default_factory=list, repr=False)
    newsletters: list[Newsletter] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.user_id, "user_id")
        _require_non_empty(self.name, "name")
        _require_email(self.email)
        _require_non_empty(self.password_hash, "password_hash")
        _require_positive_int(self.role_id, "role_id")
        if self.club_id is not None:
            _require_positive_int(self.club_id, "club_id")


@dataclass(slots=True, kw_only=True)
class Category(AuditMixin):
    """Table CATEGORY. Corresponds to `id_category`, `name`, `description`."""

    category_id: int
    name: str
    description: str = ""

    event_links: list[EventCategory] = field(default_factory=list, repr=False)
    events: list[Event] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.category_id, "category_id")
        _require_non_empty(self.name, "name")


@dataclass(slots=True, kw_only=True)
class Event(AuditMixin):
    """Table EVENT. Corresponds to `id_event` and its authored scheduling data."""

    event_id: int
    title: str
    description: str = ""
    event_date: date
    start_date: datetime
    end_date: datetime
    image: str = ""
    is_active: bool = True
    is_external: bool = False
    status: str = EventStatus.DRAFT.value
    city: str = ""
    location: str = ""
    eventbrite_event_id: str = ""
    eventbrite_url: str = ""
    eventbrite_status: str = ""
    eventbrite_last_synced_at: Optional[datetime] = None
    eventbrite_last_error: str = ""

    user_id: Optional[int]

    user: Optional[User] = None
    event_categories: list[EventCategory] = field(default_factory=list, repr=False)
    categories: list[Category] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.event_id, "event_id")
        _require_non_empty(self.title, "title")
        _require_date(self.event_date, "event_date")
        _require_datetime(self.start_date, "start_date")
        _require_datetime(self.end_date, "end_date")
        _require_chronological(self.start_date, self.end_date)
        _require_non_empty(self.status, "status")
        if self.user_id is not None:
            _require_positive_int(self.user_id, "user_id")


@dataclass(slots=True, kw_only=True)
class EventCategory:
    """Table EVENT_CATEGORY. Join table for EVENT and CATEGORY."""

    event_id: int
    category_id: int

    event: Optional[Event] = None
    category: Optional[Category] = None

    def __post_init__(self) -> None:
        _require_positive_int(self.event_id, "event_id")
        _require_positive_int(self.category_id, "category_id")


@dataclass(slots=True, kw_only=True)
class Book(CreatedAtMixin):
    """Table BOOKS. Corresponds to `id_books` and its club ownership."""

    book_id: int
    title: str
    author: str
    publisher: str
    publication_year: int
    cover_image: str
    summary: str
    is_active: bool = True
    is_featured: bool

    club_id: Optional[int]

    club: Optional[Club] = None

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.book_id, "book_id")
        _require_non_empty(self.title, "title")
        _require_non_empty(self.author, "author")
        _require_positive_int(self.publication_year, "publication_year")
        if self.club_id is not None:
            _require_positive_int(self.club_id, "club_id")


@dataclass(slots=True, kw_only=True)
class Session(AuditMixin):
    """Table SESSIONS. Corresponds to club sessions with date and time windows."""

    session_id: int
    name: str
    title: str
    description: str
    session_date: date
    start_date: datetime
    end_date: datetime
    location: str = ""
    is_active: bool = True

    club_id: Optional[int]

    club: Optional[Club] = None

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.session_id, "session_id")
        _require_non_empty(self.name, "name")
        _require_non_empty(self.title, "title")
        _require_date(self.session_date, "session_date")
        _require_datetime(self.start_date, "start_date")
        _require_datetime(self.end_date, "end_date")
        _require_chronological(self.start_date, self.end_date)
        if self.club_id is not None:
            _require_positive_int(self.club_id, "club_id")


@dataclass(slots=True, kw_only=True)
class Registration(CreatedAtMixin):
    """Table REGISTRATIONS. Corresponds to participant registration submissions."""

    registration_id: int
    name: str
    email: str
    phone: str
    message: str

    registration_status_id: Optional[int]

    registration_status: Optional[RegistrationStatus] = None
    club_links: list[ClubRegistration] = field(default_factory=list, repr=False)
    clubs: list[Club] = field(default_factory=list, repr=False)

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.registration_id, "registration_id")
        _require_non_empty(self.name, "name")
        _require_email(self.email)
        if self.registration_status_id is not None:
            _require_positive_int(self.registration_status_id, "registration_status_id")


@dataclass(slots=True, kw_only=True)
class ClubRegistration:
    """Table CLUBS_REGISTRATIONS. Join table for CLUBS and REGISTRATIONS."""

    club_id: int
    registration_id: int

    club: Optional[Club] = None
    registration: Optional[Registration] = None

    def __post_init__(self) -> None:
        _require_positive_int(self.club_id, "club_id")
        _require_positive_int(self.registration_id, "registration_id")


@dataclass(slots=True, kw_only=True)
class News(AuditMixin):
    """Table NEWS. Corresponds to `id_news`, content, status and owning club."""

    news_id: int
    title: str
    summary: str
    image: str
    is_active: bool = True
    published_at: Optional[datetime]
    content: str

    news_status_id: int
    club_id: int

    news_status: Optional[NewsStatus] = None
    club: Optional[Club] = None

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.news_id, "news_id")
        _require_non_empty(self.title, "title")
        _require_non_empty(self.content, "content")
        _require_positive_int(self.news_status_id, "news_status_id")
        _require_positive_int(self.club_id, "club_id")
        if self.published_at is not None:
            _require_datetime(self.published_at, "published_at")


@dataclass(slots=True, kw_only=True)
class Newsletter(CreatedAtMixin):
    """Table NEWSLETTERS. Corresponds to authored newsletter campaigns."""

    newsletter_id: int
    title: str
    subject: str
    content: str
    status: str = NewsletterStatus.DRAFT.value
    sent_at: Optional[datetime] = None

    user_id: Optional[int]

    user: Optional[User] = None

    def __post_init__(self) -> None:
        super().__post_init__()
        _require_positive_int(self.newsletter_id, "newsletter_id")
        _require_non_empty(self.title, "title")
        _require_non_empty(self.subject, "subject")
        _require_non_empty(self.content, "content")
        _require_non_empty(self.status, "status")
        if self.user_id is not None:
            _require_positive_int(self.user_id, "user_id")
        if self.sent_at is not None:
            _require_datetime(self.sent_at, "sent_at")


@dataclass(slots=True, kw_only=True)
class NewsletterSubscriber:
    """Table NEWS_LETTER_SUBSCRIBERS. Corresponds to newsletter subscriber records."""

    newsletter_subscriber_id: int
    email: str
    is_active: bool
    subscribed_at: datetime

    def __post_init__(self) -> None:
        _require_positive_int(self.newsletter_subscriber_id, "newsletter_subscriber_id")
        _require_email(self.email)
        _require_datetime(self.subscribed_at, "subscribed_at")


def build_example_objects() -> dict[str, object]:
    """Example instances for quick manual testing of the domain layer."""

    role = Role(
        role_id=1,
        name="superadmin",
        description="System administrator.",
    )

    club = Club(
        club_id=1,
        name="Clube de Leitura",
        description="Academic reading club.",
        mission="Promote reading, reflection and debate.",
        is_active=True,
        enable_registrations=True,
        created_at=datetime(2026, 3, 18, 10, 0, 0),
    )

    user = User(
        user_id=10,
        name="Ana Martins",
        email="ana.martins@ispgaya.pt",
        password_hash="pbkdf2_sha256$example",
        is_active=True,
        created_at=datetime(2026, 3, 18, 10, 5, 0),
        updated_at=datetime(2026, 3, 18, 10, 5, 0),
        role_id=role.role_id,
        club_id=club.club_id,
        role=role,
        club=club,
    )

    category = Category(
        category_id=5,
        name="Culture",
        description="General cultural programming.",
        created_at=datetime(2026, 3, 18, 10, 10, 0),
        updated_at=datetime(2026, 3, 18, 10, 10, 0),
    )

    event = Event(
        event_id=100,
        title="Spring Reading Session",
        description="Open literary discussion with invited guests.",
        event_date=date(2026, 4, 2),
        start_date=datetime(2026, 4, 2, 18, 0, 0),
        end_date=datetime(2026, 4, 2, 20, 0, 0),
        image="/media/events/reading-session.jpg",
        is_external=False,
        status=EventStatus.PUBLISHED.value,
        user_id=user.user_id,
        created_at=datetime(2026, 3, 18, 10, 20, 0),
        updated_at=datetime(2026, 3, 18, 10, 20, 0),
        city="Vila Nova de Gaia",
        location="Main Auditorium",
        user=user,
        categories=[category],
    )

    newsletter = Newsletter(
        newsletter_id=55,
        title="April Cultural Agenda",
        subject="Upcoming academic and cultural events",
        content="Monthly summary of events and sessions.",
        status=NewsletterStatus.DRAFT.value,
        sent_at=None,
        user_id=user.user_id,
        user=user,
        created_at=datetime(2026, 3, 18, 10, 30, 0),
    )

    return {
        "role": role,
        "club": club,
        "user": user,
        "category": category,
        "event": event,
        "newsletter": newsletter,
    }


if __name__ == "__main__":
    for key, instance in build_example_objects().items():
        print(f"{key}: {instance!r}")
