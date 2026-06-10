from __future__ import annotations

from datetime import date, datetime
from typing import ClassVar, Optional

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, JSON, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base class for SQLAlchemy declarative mappings."""


class ReprMixin:
    """Simple readable repr for ORM entities."""

    __repr_fields__: ClassVar[tuple[str, ...]] = ()

    def __repr__(self) -> str:
        field_values = ", ".join(
            f"{field}={getattr(self, field)!r}" for field in self.__repr_fields__
        )
        return f"{self.__class__.__name__}({field_values})"


class CreatedAtMixin:
    """Reusable SQLAlchemy mixin for entities with `created_at`."""

    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class AuditMixin(CreatedAtMixin):
    """Reusable SQLAlchemy mixin for entities with `created_at` and `updated_at`."""

    updated_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)


class Role(Base, ReprMixin):
    """Table ROLE."""

    __tablename__ = "role"
    __repr_fields__ = ("role_id", "name")

    role_id: Mapped[int] = mapped_column("id_role", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    users: Mapped[list[User]] = relationship(back_populates="role")


class NewsStatus(Base, ReprMixin):
    """Table NSTATUS."""

    __tablename__ = "nstatus"
    __repr_fields__ = ("news_status_id", "name")

    news_status_id: Mapped[int] = mapped_column("id_nstatus", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    news_items: Mapped[list[News]] = relationship(back_populates="news_status")


class RegistrationStatus(Base, ReprMixin):
    """Table RSTATUS."""

    __tablename__ = "rstatus"
    __repr_fields__ = ("registration_status_id", "name")

    registration_status_id: Mapped[int] = mapped_column("id_rstatus", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    registrations: Mapped[list[Registration]] = relationship(back_populates="registration_status")


class Club(Base, CreatedAtMixin, ReprMixin):
    """Table CLUBS."""

    __tablename__ = "clubs"
    __repr_fields__ = ("club_id", "name", "is_active")

    club_id: Mapped[int] = mapped_column("id_clubs", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    mission: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    enable_registrations: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    members: Mapped[list[User]] = relationship(back_populates="club")
    books: Mapped[list[Book]] = relationship(back_populates="club")
    sessions: Mapped[list[Session]] = relationship(back_populates="club")
    registration_links: Mapped[list[ClubRegistration]] = relationship(back_populates="club")
    registrations: Mapped[list[Registration]] = relationship(
        secondary="clubs_registrations",
        back_populates="clubs",
        viewonly=True,
    )
    news_items: Mapped[list[News]] = relationship(back_populates="club")


class User(Base, AuditMixin, ReprMixin):
    """Table USER."""

    __tablename__ = "user"
    __repr_fields__ = ("user_id", "name", "email", "is_active")

    user_id: Mapped[int] = mapped_column("id_user", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    role_id: Mapped[int] = mapped_column("id_role", ForeignKey("role.id_role"), nullable=False)
    club_id: Mapped[Optional[int]] = mapped_column(
        "id_clubs",
        ForeignKey("clubs.id_clubs"),
        nullable=True,
    )

    role: Mapped[Role] = relationship(back_populates="users")
    club: Mapped[Optional[Club]] = relationship(back_populates="members")
    events: Mapped[list[Event]] = relationship(back_populates="user")
    newsletters: Mapped[list[Newsletter]] = relationship(back_populates="user")


class Category(Base, AuditMixin, ReprMixin):
    """Table CATEGORY."""

    __tablename__ = "category"
    __repr_fields__ = ("category_id", "name")

    category_id: Mapped[int] = mapped_column("id_category", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")

    event_links: Mapped[list[EventCategory]] = relationship(back_populates="category")
    events: Mapped[list[Event]] = relationship(
        secondary="event_category",
        back_populates="categories",
        viewonly=True,
    )


class Event(Base, AuditMixin, ReprMixin):
    """Table EVENT."""

    __tablename__ = "event"
    __repr_fields__ = ("event_id", "title", "status")

    event_id: Mapped[int] = mapped_column("id_event", Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    image: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_external: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    enable_registrations: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    registration_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False, default="")
    location: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    eventbrite_event_id: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    eventbrite_url: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    eventbrite_status: Mapped[str] = mapped_column(String(32), nullable=False, default="")
    eventbrite_last_synced_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    eventbrite_last_error: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    eventbrite_venue_id: Mapped[str] = mapped_column(String(64), nullable=False, default="")
    eventbrite_venue: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    eventbrite_ticket_classes: Mapped[Optional[list]] = mapped_column(JSON, nullable=True)

    user_id: Mapped[Optional[int]] = mapped_column(
        "user_id",
        ForeignKey("user.id_user", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped[Optional[User]] = relationship(back_populates="events")
    event_categories: Mapped[list[EventCategory]] = relationship(back_populates="event")
    registration_links: Mapped[list[EventRegistration]] = relationship(back_populates="event")
    categories: Mapped[list[Category]] = relationship(
        secondary="event_category",
        back_populates="events",
        viewonly=True,
    )


class EventCategory(Base, ReprMixin):
    """Table EVENT_CATEGORY."""

    __tablename__ = "event_category"
    __repr_fields__ = ("event_id", "category_id")

    event_id: Mapped[int] = mapped_column(
        "id_event",
        ForeignKey("event.id_event"),
        primary_key=True,
    )
    category_id: Mapped[int] = mapped_column(
        "id_category",
        ForeignKey("category.id_category"),
        primary_key=True,
    )

    event: Mapped[Event] = relationship(back_populates="event_categories")
    category: Mapped[Category] = relationship(back_populates="event_links")


class Book(Base, CreatedAtMixin, ReprMixin):
    """Table BOOKS."""

    __tablename__ = "books"
    __repr_fields__ = ("book_id", "title", "club_id")

    book_id: Mapped[int] = mapped_column("id_books", Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    publication_year: Mapped[int] = mapped_column(Integer, nullable=False)
    cover_image: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    club_id: Mapped[Optional[int]] = mapped_column(
        "id_club",
        ForeignKey("clubs.id_clubs", ondelete="SET NULL"),
        nullable=True,
    )

    club: Mapped[Optional[Club]] = relationship(back_populates="books")


class Session(Base, AuditMixin, ReprMixin):
    """Table SESSIONS."""

    __tablename__ = "sessions"
    __repr_fields__ = ("session_id", "title", "club_id")

    session_id: Mapped[int] = mapped_column("id_sessions", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    enable_registrations: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    registration_capacity: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    club_id: Mapped[Optional[int]] = mapped_column(
        "id_club",
        ForeignKey("clubs.id_clubs", ondelete="SET NULL"),
        nullable=True,
    )

    club: Mapped[Optional[Club]] = relationship(back_populates="sessions")
    registration_links: Mapped[list[SessionRegistration]] = relationship(back_populates="session")


class Registration(Base, CreatedAtMixin, ReprMixin):
    """Table REGISTRATIONS."""

    __tablename__ = "registrations"
    __repr_fields__ = ("registration_id", "name", "email")

    registration_id: Mapped[int] = mapped_column("id_registrations", Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(50), nullable=False, default="")
    message: Mapped[str] = mapped_column(Text, nullable=False, default="")

    registration_status_id: Mapped[Optional[int]] = mapped_column(
        "id_rstatus",
        ForeignKey("rstatus.id_rstatus", ondelete="SET NULL"),
        nullable=True,
    )

    registration_status: Mapped[RegistrationStatus] = relationship(back_populates="registrations")
    club_links: Mapped[list[ClubRegistration]] = relationship(back_populates="registration")
    event_links: Mapped[list[EventRegistration]] = relationship(back_populates="registration")
    session_links: Mapped[list[SessionRegistration]] = relationship(back_populates="registration")
    clubs: Mapped[list[Club]] = relationship(
        secondary="clubs_registrations",
        back_populates="registrations",
        viewonly=True,
    )


class ClubRegistration(Base, ReprMixin):
    """Table CLUBS_REGISTRATIONS."""

    __tablename__ = "clubs_registrations"
    __repr_fields__ = ("club_id", "registration_id")

    club_id: Mapped[int] = mapped_column(
        "id_clubs",
        ForeignKey("clubs.id_clubs", ondelete="CASCADE"),
        primary_key=True,
    )
    registration_id: Mapped[int] = mapped_column(
        "id_registrations",
        ForeignKey("registrations.id_registrations"),
        primary_key=True,
    )

    club: Mapped[Club] = relationship(back_populates="registration_links")
    registration: Mapped[Registration] = relationship(back_populates="club_links")


class EventRegistration(Base, CreatedAtMixin, ReprMixin):
    """Table EVENT_REGISTRATIONS."""

    __tablename__ = "event_registrations"
    __repr_fields__ = ("event_id", "registration_id")

    event_id: Mapped[int] = mapped_column(
        "id_event",
        ForeignKey("event.id_event"),
        primary_key=True,
    )
    registration_id: Mapped[int] = mapped_column(
        "id_registrations",
        ForeignKey("registrations.id_registrations"),
        primary_key=True,
    )
    reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    event: Mapped[Event] = relationship(back_populates="registration_links")
    registration: Mapped[Registration] = relationship(back_populates="event_links")


class SessionRegistration(Base, CreatedAtMixin, ReprMixin):
    """Table SESSION_REGISTRATIONS."""

    __tablename__ = "session_registrations"
    __repr_fields__ = ("session_id", "registration_id")

    session_id: Mapped[int] = mapped_column(
        "id_sessions",
        ForeignKey("sessions.id_sessions"),
        primary_key=True,
    )
    registration_id: Mapped[int] = mapped_column(
        "id_registrations",
        ForeignKey("registrations.id_registrations"),
        primary_key=True,
    )
    reminder_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    session: Mapped[Session] = relationship(back_populates="registration_links")
    registration: Mapped[Registration] = relationship(back_populates="session_links")


class News(Base, AuditMixin, ReprMixin):
    """Table NEWS."""

    __tablename__ = "news"
    __repr_fields__ = ("news_id", "title", "club_id")

    news_id: Mapped[int] = mapped_column("id_news", Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False, default="")
    image: Mapped[str] = mapped_column(String(500), nullable=False, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=False)

    news_status_id: Mapped[int] = mapped_column(
        "id_nstatus",
        ForeignKey("nstatus.id_nstatus"),
        nullable=False,
    )
    club_id: Mapped[Optional[int]] = mapped_column(
        "id_clubs",
        ForeignKey("clubs.id_clubs", ondelete="SET NULL"),
        nullable=True,
    )

    news_status: Mapped[NewsStatus] = relationship(back_populates="news_items")
    club: Mapped[Optional[Club]] = relationship(back_populates="news_items")


class Newsletter(Base, CreatedAtMixin, ReprMixin):
    """Table NEWSLETTERS."""

    __tablename__ = "newsletters"
    __repr_fields__ = ("newsletter_id", "title", "status")

    newsletter_id: Mapped[int] = mapped_column("id_newsletter", Integer, primary_key=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user_id: Mapped[Optional[int]] = mapped_column(
        "user_id",
        ForeignKey("user.id_user", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped[Optional[User]] = relationship(back_populates="newsletters")


class NewsletterSubscriber(Base, ReprMixin):
    """Table NEWS_LETTER_SUBSCRIBERS."""

    __tablename__ = "news_letter_subscribers"
    __repr_fields__ = ("newsletter_subscriber_id", "email", "is_active")

    newsletter_subscriber_id: Mapped[int] = mapped_column(
        "id_newsletter_sub",
        Integer,
        primary_key=True,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    subscribed_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
