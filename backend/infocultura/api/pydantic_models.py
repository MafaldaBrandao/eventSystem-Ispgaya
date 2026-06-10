from __future__ import annotations

from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

from .domain_models import EventStatus, NewsletterStatus


class DomainBaseModel(BaseModel):
    """Common Pydantic configuration for typed domain schemas."""

    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True,
    )


class CreatedAtSchema(DomainBaseModel):
    """Reusable schema for entities with `created_at`."""

    created_at: datetime


class AuditSchema(CreatedAtSchema):
    """Reusable schema for entities with `created_at` and `updated_at`."""

    updated_at: datetime

    @model_validator(mode="after")
    def validate_audit_window(self) -> AuditSchema:
        if self.updated_at < self.created_at:
            raise ValueError("updated_at must be greater than or equal to created_at.")
        return self


class RoleModel(DomainBaseModel):
    """Pydantic model for table ROLE."""

    role_id: int
    name: str
    description: str = ""
    users: list[UserModel] = Field(default_factory=list)

    @field_validator("role_id")
    @classmethod
    def validate_role_id(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("role_id must be a positive integer.")
        return value

    @field_validator("name")
    @classmethod
    def validate_name(cls, value: str) -> str:
        if not value:
            raise ValueError("name is required.")
        return value


class NewsStatusModel(DomainBaseModel):
    """Pydantic model for table NSTATUS."""

    news_status_id: int
    name: str
    description: str = ""
    news_items: list[NewsModel] = Field(default_factory=list)


class RegistrationStatusModel(DomainBaseModel):
    """Pydantic model for table RSTATUS."""

    registration_status_id: int
    name: str
    description: str = ""
    registrations: list[RegistrationModel] = Field(default_factory=list)


class ClubModel(CreatedAtSchema):
    """Pydantic model for table CLUBS."""

    club_id: int
    name: str
    description: str = ""
    mission: str = ""
    is_active: bool = True
    enable_registrations: bool = True

    members: list[UserModel] = Field(default_factory=list)
    books: list[BookModel] = Field(default_factory=list)
    sessions: list[SessionModel] = Field(default_factory=list)
    registrations: list[RegistrationModel] = Field(default_factory=list)
    registration_links: list[ClubRegistrationModel] = Field(default_factory=list)
    news_items: list[NewsModel] = Field(default_factory=list)


class UserModel(AuditSchema):
    """Pydantic model for table USER."""

    user_id: int
    name: str
    email: str
    password_hash: str
    is_active: bool
    role_id: int
    club_id: Optional[int] = None

    role: Optional[RoleModel] = None
    club: Optional[ClubModel] = None
    events: list[EventModel] = Field(default_factory=list)
    newsletters: list[NewsletterModel] = Field(default_factory=list)

    @field_validator("user_id", "role_id", "club_id")
    @classmethod
    def validate_positive_optional_ints(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value <= 0:
            raise ValueError("identifier values must be positive integers.")
        return value

    @field_validator("name", "password_hash")
    @classmethod
    def validate_required_strings(cls, value: str) -> str:
        if not value:
            raise ValueError("field is required.")
        return value

    @field_validator("email")
    @classmethod
    def validate_email(cls, value: str) -> str:
        if "@" not in value or value.startswith("@") or value.endswith("@"):
            raise ValueError("email must be valid.")
        return value


class CategoryModel(AuditSchema):
    """Pydantic model for table CATEGORY."""

    category_id: int
    name: str
    description: str = ""

    event_links: list[EventCategoryModel] = Field(default_factory=list)
    events: list[EventModel] = Field(default_factory=list)


class EventModel(AuditSchema):
    """Pydantic model for table EVENT."""

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
    user_id: Optional[int] = None

    user: Optional[UserModel] = None
    event_categories: list[EventCategoryModel] = Field(default_factory=list)
    categories: list[CategoryModel] = Field(default_factory=list)

    @field_validator("event_id")
    @classmethod
    def validate_positive_ids(cls, value: int) -> int:
        if value <= 0:
            raise ValueError("identifier values must be positive integers.")
        return value

    @field_validator("user_id")
    @classmethod
    def validate_positive_optional_user_id(cls, value: Optional[int]) -> Optional[int]:
        if value is not None and value <= 0:
            raise ValueError("identifier values must be positive integers.")
        return value

    @field_validator("title", "status")
    @classmethod
    def validate_non_empty_strings(cls, value: str) -> str:
        if not value:
            raise ValueError("field is required.")
        return value

    @model_validator(mode="after")
    def validate_schedule(self) -> EventModel:
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date.")
        return self


class EventCategoryModel(DomainBaseModel):
    """Pydantic model for table EVENT_CATEGORY."""

    event_id: int
    category_id: int

    event: Optional[EventModel] = None
    category: Optional[CategoryModel] = None


class BookModel(CreatedAtSchema):
    """Pydantic model for table BOOKS."""

    book_id: int
    title: str
    author: str
    publisher: str
    publication_year: int
    cover_image: str
    summary: str
    is_active: bool = True
    is_featured: bool
    club_id: Optional[int] = None

    club: Optional[ClubModel] = None


class SessionModel(AuditSchema):
    """Pydantic model for table SESSIONS."""

    session_id: int
    name: str
    title: str
    description: str
    session_date: date
    start_date: datetime
    end_date: datetime
    is_active: bool = True
    club_id: Optional[int] = None

    club: Optional[ClubModel] = None

    @model_validator(mode="after")
    def validate_schedule(self) -> SessionModel:
        if self.end_date < self.start_date:
            raise ValueError("end_date must be greater than or equal to start_date.")
        return self


class RegistrationModel(CreatedAtSchema):
    """Pydantic model for table REGISTRATIONS."""

    registration_id: int
    name: str
    email: str
    phone: str
    message: str
    registration_status_id: Optional[int] = None

    registration_status: Optional[RegistrationStatusModel] = None
    club_links: list[ClubRegistrationModel] = Field(default_factory=list)
    clubs: list[ClubModel] = Field(default_factory=list)


class ClubRegistrationModel(DomainBaseModel):
    """Pydantic model for table CLUBS_REGISTRATIONS."""

    club_id: int
    registration_id: int

    club: Optional[ClubModel] = None
    registration: Optional[RegistrationModel] = None


class NewsModel(AuditSchema):
    """Pydantic model for table NEWS."""

    news_id: int
    title: str
    summary: str
    image: str
    is_active: bool = True
    published_at: Optional[datetime] = None
    content: str
    news_status_id: int
    club_id: int

    news_status: Optional[NewsStatusModel] = None
    club: Optional[ClubModel] = None


class NewsletterModel(CreatedAtSchema):
    """Pydantic model for table NEWSLETTERS."""

    newsletter_id: int
    title: str
    subject: str
    content: str
    status: str = NewsletterStatus.DRAFT.value
    sent_at: Optional[datetime] = None
    user_id: Optional[int] = None

    user: Optional[UserModel] = None


class NewsletterSubscriberModel(DomainBaseModel):
    """Pydantic model for table NEWS_LETTER_SUBSCRIBERS."""

    newsletter_subscriber_id: int
    email: str
    is_active: bool
    subscribed_at: datetime


RoleModel.model_rebuild()
NewsStatusModel.model_rebuild()
RegistrationStatusModel.model_rebuild()
ClubModel.model_rebuild()
UserModel.model_rebuild()
CategoryModel.model_rebuild()
EventModel.model_rebuild()
EventCategoryModel.model_rebuild()
BookModel.model_rebuild()
SessionModel.model_rebuild()
RegistrationModel.model_rebuild()
ClubRegistrationModel.model_rebuild()
NewsModel.model_rebuild()
NewsletterModel.model_rebuild()
NewsletterSubscriberModel.model_rebuild()
