from __future__ import annotations

from datetime import date, datetime
from typing import ClassVar, Optional

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    """Base metadata that mirrors the current live MySQL schema."""


class ReprMixin:
    """Simple readable repr for ORM entities."""

    __repr_fields__: ClassVar[tuple[str, ...]] = ()

    def __repr__(self) -> str:
        field_values = ", ".join(
            f"{field}={getattr(self, field)!r}" for field in self.__repr_fields__
        )
        return f"{self.__class__.__name__}({field_values})"


class CreatedAtMixin:
    """Reusable mixin for tables with `created_at`."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )


class AuditMixin(CreatedAtMixin):
    """Reusable mixin for tables with `created_at` and `updated_at`."""

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )


class Role(Base, ReprMixin):
    """Live table `roles`."""

    __tablename__ = "roles"
    __table_args__ = (UniqueConstraint("name", name="name"),)
    __repr_fields__ = ("id", "name")

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    users: Mapped[list[User]] = relationship(back_populates="role")


class Club(Base, ReprMixin):
    """Live table `clubs`."""

    __tablename__ = "clubs"
    __repr_fields__ = ("id_clubs", "name", "is_active")

    id_clubs: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    mission: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image: Mapped[str] = mapped_column(String(500), nullable=False, server_default=text("''"))
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        server_default=text("1"),
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    enable_registrations: Mapped[Optional[bool]] = mapped_column(Boolean, nullable=True)

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


class User(Base, ReprMixin):
    """Live table `users`."""

    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("email", name="email"),
        Index("fk_user_role", "role_id"),
        Index("fk_users_clubs", "id_clubs"),
    )
    __repr_fields__ = ("id", "name", "email", "is_active")

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("roles.id", name="fk_user_role"),
        nullable=False,
    )
    is_active: Mapped[Optional[bool]] = mapped_column(
        Boolean,
        nullable=True,
        server_default=text("1"),
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    id_clubs: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey(
            "clubs.id_clubs",
            name="fk_users_clubs",
            onupdate="CASCADE",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    role: Mapped[Role] = relationship(back_populates="users")
    club: Mapped[Optional[Club]] = relationship(back_populates="members")
    events: Mapped[list[Event]] = relationship(back_populates="user")
    newsletters: Mapped[list[Newsletter]] = relationship(back_populates="user")


class Registration(Base, ReprMixin):
    """Live table `registrations`."""

    __tablename__ = "registrations"
    __repr_fields__ = ("id_registrations", "name", "email", "status")

    id_registrations: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    email: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        server_default=text("'pending'"),
    )
    created_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True,
        server_default=text("CURRENT_TIMESTAMP"),
    )
    id_rstatus: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey(
            "rstatus.id_rstatus",
            name="fk_registrations_rstatus",
            ondelete="SET NULL",
        ),
        nullable=True,
    )

    club_links: Mapped[list[ClubRegistration]] = relationship(back_populates="registration")
    clubs: Mapped[list[Club]] = relationship(
        secondary="clubs_registrations",
        back_populates="registrations",
        viewonly=True,
    )
    registration_status: Mapped[Optional[RegistrationStatus]] = relationship(
        back_populates="registrations"
    )


class Category(Base, AuditMixin, ReprMixin):
    """Managed table `category` to classify events."""

    __tablename__ = "category"
    __repr_fields__ = ("id_category", "name")

    id_category: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    event_links: Mapped[list[EventCategory]] = relationship(back_populates="category")
    events: Mapped[list[Event]] = relationship(
        secondary="event_category",
        back_populates="categories",
        viewonly=True,
    )


class NewsStatus(Base, ReprMixin):
    """Managed table `nstatus` for news publication states."""

    __tablename__ = "nstatus"
    __repr_fields__ = ("id_nstatus", "name")

    id_nstatus: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    news_items: Mapped[list[News]] = relationship(back_populates="news_status")


class RegistrationStatus(Base, ReprMixin):
    """Managed table `rstatus` for future registration status normalization."""

    __tablename__ = "rstatus"
    __repr_fields__ = ("id_rstatus", "name")

    id_rstatus: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    registrations: Mapped[list[Registration]] = relationship(back_populates="registration_status")


class Book(Base, CreatedAtMixin, ReprMixin):
    """Managed table `books` linked to clubs."""

    __tablename__ = "books"
    __repr_fields__ = ("id_books", "title", "id_club")

    id_books: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    publisher: Mapped[str] = mapped_column(String(255), nullable=False, server_default=text("''"))
    publication_year: Mapped[int] = mapped_column(Integer, nullable=False)
    cover_image: Mapped[str] = mapped_column(String(500), nullable=False, server_default=text("''"))
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    is_featured: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    id_club: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("clubs.id_clubs", ondelete="SET NULL"),
        nullable=True,
    )

    club: Mapped[Optional[Club]] = relationship(back_populates="books")


class Session(Base, AuditMixin, ReprMixin):
    """Managed table `sessions` linked to clubs."""

    __tablename__ = "sessions"
    __repr_fields__ = ("id_sessions", "title", "id_club")

    id_sessions: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=False, server_default=text("''"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    id_club: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("clubs.id_clubs", ondelete="SET NULL"),
        nullable=True,
    )

    club: Mapped[Optional[Club]] = relationship(back_populates="sessions")


class ClubRegistration(Base, ReprMixin):
    """Managed link table `clubs_registrations`."""

    __tablename__ = "clubs_registrations"
    __repr_fields__ = ("id_clubs", "id_registrations")

    id_clubs: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("clubs.id_clubs", ondelete="CASCADE"),
        primary_key=True,
    )
    id_registrations: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("registrations.id_registrations"),
        primary_key=True,
    )

    club: Mapped[Club] = relationship(back_populates="registration_links")
    registration: Mapped[Registration] = relationship(back_populates="club_links")


class Event(Base, AuditMixin, ReprMixin):
    """Managed table `event` linked to existing users."""

    __tablename__ = "event"
    __repr_fields__ = ("id_event", "title", "status")

    id_event: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    event_date: Mapped[date] = mapped_column(Date, nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    image: Mapped[str] = mapped_column(String(500), nullable=False, server_default=text("''"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    is_external: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("0"))
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    city: Mapped[str] = mapped_column(String(120), nullable=False, server_default=text("''"))
    location: Mapped[str] = mapped_column(String(255), nullable=False, server_default=text("''"))
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped[Optional[User]] = relationship(back_populates="events")
    event_categories: Mapped[list[EventCategory]] = relationship(back_populates="event")
    categories: Mapped[list[Category]] = relationship(
        secondary="event_category",
        back_populates="events",
        viewonly=True,
    )


class EventCategory(Base, ReprMixin):
    """Managed link table `event_category`."""

    __tablename__ = "event_category"
    __repr_fields__ = ("id_event", "id_category")

    id_event: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("event.id_event"),
        primary_key=True,
    )
    id_category: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("category.id_category"),
        primary_key=True,
    )

    event: Mapped[Event] = relationship(back_populates="event_categories")
    category: Mapped[Category] = relationship(back_populates="event_links")


class News(Base, AuditMixin, ReprMixin):
    """Managed table `news` linked to clubs and news statuses."""

    __tablename__ = "news"
    __repr_fields__ = ("id_news", "title", "id_clubs")

    id_news: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    image: Mapped[str] = mapped_column(String(500), nullable=False, server_default=text("''"))
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    id_nstatus: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("nstatus.id_nstatus"),
        nullable=False,
    )
    published_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    id_clubs: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("clubs.id_clubs", ondelete="SET NULL"),
        nullable=True,
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)

    news_status: Mapped[NewsStatus] = relationship(back_populates="news_items")
    club: Mapped[Optional[Club]] = relationship(back_populates="news_items")


class Newsletter(Base, CreatedAtMixin, ReprMixin):
    """Managed table `newsletters` linked to existing users."""

    __tablename__ = "newsletters"
    __repr_fields__ = ("id_newsletter", "title", "status")

    id_newsletter: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False)
    sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    user: Mapped[Optional[User]] = relationship(back_populates="newsletters")


class NewsletterSubscriber(Base, ReprMixin):
    """Managed table `news_letter_subscribers`."""

    __tablename__ = "news_letter_subscribers"
    __table_args__ = (UniqueConstraint("email", name="uq_news_letter_subscribers_email"),)
    __repr_fields__ = ("id_newsletter_sub", "email", "is_active")

    id_newsletter_sub: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, server_default=text("1"))
    subscribed_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        server_default=text("CURRENT_TIMESTAMP"),
    )
