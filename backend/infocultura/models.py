import uuid
from django.db import models
from django.utils import timezone
from .database import constants as db_constants

class Role(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True, null=True)

    class Meta:
        db_table = db_constants.TABLE_ROLE
        managed = False

    def __str__(self):
        return self.name


class AppUser(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150)
    email = models.EmailField(max_length=150, unique=True, db_index=True)
    password_hash = models.CharField(max_length=255)
    role = models.ForeignKey(Role, on_delete=models.DO_NOTHING, db_column=db_constants.COL_ROLE_ID)
    club = models.ForeignKey(
        'Club',
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_CLUBS,
        blank=True,
        null=True,
        related_name='members',
    )
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = db_constants.TABLE_USER
        managed = False

    @property
    def is_authenticated(self):
        return True

    @property
    def is_anonymous(self):
        return False

    def __str__(self):
        return self.email


class CulturalContent(models.Model):
    AREA_CHOICES = [
        ('tuna', 'Tuna Academica'),
        ('clube-leitura', 'Clube de Leitura'),
        ('teatro', 'Teatro'),
    ]

    STATUS_CHOICES = [
        ('rascunho', 'Rascunho'),
        ('publicado', 'Publicado'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    area = models.CharField(max_length=32, choices=AREA_CHOICES)
    title = models.CharField(max_length=180)
    description = models.TextField()
    date = models.DateField()
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='rascunho')
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = db_constants.TABLE_CULTURAL_CONTENT
        ordering = ['-updated_at']

    def __str__(self):
        return f'{self.title} ({self.area})'


class PhotoCarouselItem(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    section = models.CharField(max_length=80, default='homepage')
    title = models.CharField(max_length=180)
    caption = models.TextField(blank=True, default='')
    image = models.CharField(max_length=500)
    alt_text = models.CharField(max_length=255, blank=True, default='')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = db_constants.TABLE_PHOTO_CAROUSEL_ITEM
        ordering = ['section', 'display_order', '-updated_at']

    def __str__(self):
        return f'{self.section}: {self.title}'


class Club(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_CLUBS)
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    mission = models.TextField(blank=True, null=True)
    image = models.CharField(max_length=500, blank=True, null=True, default='')
    is_active = models.BooleanField(default=True)
    enable_registrations = models.BooleanField(blank=True, null=True, default=False)
    created_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = db_constants.TABLE_CLUB
        managed = False
        ordering = ['name']

    def __str__(self):
        return self.name


class NewsStatus(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_NSTATUS)
    name = models.CharField(max_length=100)
    description = models.TextField()

    class Meta:
        db_table = db_constants.TABLE_NEWS_STATUS
        managed = False
        ordering = ['name']

    def __str__(self):
        return self.name


class News(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_NEWS)
    title = models.CharField(max_length=255)
    summary = models.TextField()
    image = models.CharField(max_length=500)
    is_active = models.BooleanField(default=True)
    news_status = models.ForeignKey(
        NewsStatus,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_NSTATUS,
        related_name='news_items',
    )
    published_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField()
    updated_at = models.DateTimeField()
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        db_column=db_constants.COL_ID_CLUBS,
        blank=True,
        null=True,
        related_name='news_items',
    )
    content = models.TextField()

    class Meta:
        db_table = db_constants.TABLE_NEWS
        managed = False
        ordering = ['-published_at', '-created_at', '-id']

    def __str__(self):
        return self.title


class Book(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_BOOKS)
    title = models.CharField(max_length=255)
    author = models.CharField(max_length=255)
    publisher = models.CharField(max_length=255, blank=True, default='')
    publication_year = models.IntegerField()
    cover_image = models.CharField(max_length=500, blank=True, default='')
    summary = models.TextField()
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    created_at = models.DateTimeField(blank=True, null=True)
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        db_column=db_constants.COL_CLUB_ID,
        blank=True,
        null=True,
        related_name='books',
    )

    class Meta:
        db_table = db_constants.TABLE_BOOK
        managed = False
        ordering = ['-is_featured', 'title', '-id']

    def __str__(self):
        return self.title


class Session(models.Model):
    STATUS_CHOICES = [
        ('active', 'Ativo'),
        ('completed', 'Concluido'),
        ('cancelled', 'Cancelado'),
    ]

    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_SESSIONS)
    name = models.CharField(max_length=150)
    title = models.CharField(max_length=255)
    description = models.TextField()
    session_date = models.DateField()
    start_date = models.DateTimeField(db_column=db_constants.COL_START_DATE)
    end_date = models.DateTimeField(db_column=db_constants.COL_END_DATE)
    location = models.CharField(max_length=255, blank=True, default='')
    is_active = models.BooleanField(default=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    enable_registrations = models.BooleanField(default=False)
    registration_capacity = models.IntegerField(blank=True, null=True)
    created_at = models.DateTimeField(blank=True, null=True, db_column=db_constants.COL_CREATED_AT)
    updated_at = models.DateTimeField(blank=True, null=True, db_column=db_constants.COL_UPDATED_AT)
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        db_column=db_constants.COL_CLUB_ID,
        blank=True,
        null=True,
        related_name='sessions',
    )
    registrations = models.ManyToManyField(
        'Registration',
        through='SessionRegistration',
        related_name='sessions',
    )

    class Meta:
        db_table = db_constants.TABLE_SESSION
        managed = False
        ordering = ['session_date', 'start_date', '-id']

    def __str__(self):
        return self.title


class Category(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_CATEGORY)
    name = models.CharField(max_length=120)
    description = models.TextField()
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = db_constants.TABLE_CATEGORY
        managed = False
        ordering = ['name']

    def __str__(self):
        return self.name


class Event(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Rascunho'),
        ('review', 'Em Revisao'),
        ('published', 'Publicado'),
        ('active', 'Ativo'),
        ('completed', 'Concluido'),
        ('cancelled', 'Cancelado'),
        ('archived', 'Arquivado'),
    ]

    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_EVENT)
    title = models.CharField(max_length=255)
    description = models.TextField()
    event_date = models.DateField()
    start_date = models.DateTimeField(db_column=db_constants.COL_START_DATE)
    end_date = models.DateTimeField(db_column=db_constants.COL_END_DATE)
    image = models.CharField(max_length=500, blank=True, default='')
    is_active = models.BooleanField(default=True)
    is_external = models.BooleanField(default=False)
    enable_registrations = models.BooleanField(default=False)
    registration_capacity = models.IntegerField(blank=True, null=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='draft')
    user = models.ForeignKey(
        AppUser,
        on_delete=models.SET_NULL,
        db_column=db_constants.COL_USER_ID,
        blank=True,
        null=True,
        related_name='events',
    )
    created_at = models.DateTimeField(blank=True, null=True, db_column=db_constants.COL_CREATED_AT)
    updated_at = models.DateTimeField(blank=True, null=True, db_column=db_constants.COL_UPDATED_AT)
    city = models.CharField(max_length=120, blank=True, default='')
    location = models.CharField(max_length=255, blank=True, default='')
    # Eventbrite integration fields - populated automatically after event creation
    eventbrite_event_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    eventbrite_url = models.CharField(max_length=500, blank=True, null=True, default=None)
    eventbrite_status = models.CharField(max_length=32, blank=True, null=True, default=None)
    eventbrite_last_synced_at = models.DateTimeField(blank=True, null=True)
    eventbrite_last_error = models.TextField(blank=True, null=True, default=None)
    eventbrite_venue_id = models.CharField(max_length=64, blank=True, default='')
    eventbrite_venue = models.JSONField(blank=True, null=True, default=dict)
    eventbrite_ticket_classes = models.JSONField(blank=True, null=True, default=list)
    categories = models.ManyToManyField(
        Category,
        through='EventCategory',
        related_name='events',
    )
    registrations = models.ManyToManyField(
        'Registration',
        through='EventRegistration',
        related_name='events',
    )

    class Meta:
        db_table = db_constants.TABLE_EVENT
        managed = False
        ordering = ['event_date', 'start_date', '-id']

    @property
    def club_id(self):
        return self.user.club_id if self.user_id and self.user else None

    @property
    def club_name(self):
        return self.user.club.name if self.user_id and self.user and self.user.club else None

    def __str__(self):
        return self.title


class Newsletter(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Rascunho'),
        ('scheduled', 'Agendada'),
        ('sent', 'Enviada'),
        ('cancelled', 'Cancelada'),
    ]

    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_NEWSLETTER)
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    content = models.TextField()
    image = models.CharField(max_length=500, blank=True, default='', db_column=db_constants.COL_IMAGE)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='draft')
    sent_at = models.DateTimeField(blank=True, null=True)
    user = models.ForeignKey(
        AppUser,
        on_delete=models.SET_NULL,
        db_column=db_constants.COL_USER_ID,
        blank=True,
        null=True,
        related_name='newsletters',
    )
    created_at = models.DateTimeField(default=timezone.now, db_column=db_constants.COL_CREATED_AT)

    class Meta:
        db_table = db_constants.TABLE_NEWSLETTER
        managed = False
        ordering = ['-created_at', '-id']

    def __str__(self):
        return self.title


class NewsletterSubscriber(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_NEWSLETTER_SUB)
    email = models.EmailField(max_length=255, unique=True)
    is_active = models.BooleanField(default=True)
    subscribed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = db_constants.TABLE_NEWSLETTER_SUBSCRIBER
        managed = False
        ordering = ['-subscribed_at', '-id']

    def __str__(self):
        return self.email


class MetricView(models.Model):
    KIND_CHOICES = [
        ('page_view', 'Page View'),
    ]

    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_METRIC_VIEW)
    kind = models.CharField(max_length=32, choices=KIND_CHOICES, default='page_view')
    section = models.CharField(max_length=64, db_index=True)
    content_type = models.CharField(max_length=64, blank=True, default='')
    object_id = models.IntegerField(blank=True, null=True, db_index=True)
    title = models.CharField(max_length=255)
    page_path = models.CharField(max_length=255, db_index=True)
    locale = models.CharField(max_length=8, blank=True, default='')
    referrer = models.CharField(max_length=500, blank=True, default='')
    user_agent = models.CharField(max_length=255, blank=True, default='')
    visitor_key = models.CharField(max_length=64, blank=True, default='', db_index=True)
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        db_column=db_constants.COL_CLUB_ID,
        blank=True,
        null=True,
        related_name='metric_views',
    )
    viewed_at = models.DateTimeField(default=timezone.now, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = db_constants.TABLE_METRIC_VIEW
        ordering = ['-viewed_at', '-id']

    def __str__(self):
        return f'{self.title} @ {self.page_path}'


class EventCategory(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_EVENT,
        related_name='event_category_links',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_CATEGORY,
        related_name='event_category_links',
    )

    class Meta:
        db_table = db_constants.TABLE_EVENT_CATEGORY
        managed = False
        unique_together = ('event', 'category')


class EventRegistration(models.Model):
    event = models.ForeignKey(
        Event,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_EVENT,
        related_name='registration_links',
    )
    registration = models.ForeignKey(
        'Registration',
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_REGISTRATIONS,
        related_name='event_links',
    )
    created_at = models.DateTimeField(blank=True, null=True)
    reminder_sent_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = db_constants.TABLE_EVENT_REGISTRATION
        managed = False
        unique_together = ('event', 'registration')


class RegistrationStatus(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_RSTATUS)
    name = models.CharField(max_length=100)
    description = models.TextField()

    class Meta:
        db_table = db_constants.TABLE_REGISTRATION_STATUS
        managed = False
        ordering = ['name']

    def __str__(self):
        return self.name


class Registration(models.Model):
    id = models.AutoField(primary_key=True, db_column=db_constants.COL_ID_REGISTRATIONS)
    name = models.CharField(max_length=100)
    email = models.EmailField(max_length=150, db_index=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    message = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=50, default='pending')
    created_at = models.DateTimeField(blank=True, null=True)
    registration_status = models.ForeignKey(
        RegistrationStatus,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_RSTATUS,
        blank=True,
        null=True,
        related_name='registrations',
    )

    class Meta:
        db_table = db_constants.TABLE_REGISTRATION
        managed = False
        ordering = ['-created_at', '-id']

    def __str__(self):
        return f'{self.name} <{self.email}>'


class SessionRegistration(models.Model):
    session = models.ForeignKey(
        Session,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_SESSIONS,
        related_name='registration_links',
    )
    registration = models.ForeignKey(
        Registration,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_REGISTRATIONS,
        related_name='session_links',
    )
    created_at = models.DateTimeField(blank=True, null=True)
    reminder_sent_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = db_constants.TABLE_SESSION_REGISTRATION
        managed = False
        unique_together = ('session', 'registration')


class ClubRegistration(models.Model):
    club = models.ForeignKey(
        Club,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_CLUBS,
        related_name='club_registration_links',
    )
    registration = models.ForeignKey(
        Registration,
        on_delete=models.DO_NOTHING,
        db_column=db_constants.COL_ID_REGISTRATIONS,
        related_name='club_links',
    )

    class Meta:
        db_table = db_constants.TABLE_CLUB_REGISTRATION
        managed = False
        unique_together = ('club', 'registration')


class EditorialAction(models.Model):
    content_type = models.CharField(max_length=32)
    object_id = models.IntegerField()
    from_status = models.CharField(max_length=50, blank=True, null=True)
    to_status = models.CharField(max_length=50)
    actor_user = models.ForeignKey(
        AppUser,
        on_delete=models.SET_NULL,
        db_column='actor_user_id',
        blank=True,
        null=True,
    )
    actor_name = models.CharField(max_length=150)
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        db_column='club_id',
        blank=True,
        null=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = db_constants.TABLE_EDITORIAL_ACTION
        managed = False
        ordering = ['-created_at']


class AdminAuditLog(models.Model):
    action = models.CharField(max_length=32)
    content_type = models.CharField(max_length=32)
    object_id = models.IntegerField(blank=True, null=True)
    summary = models.CharField(max_length=255)
    actor_user = models.ForeignKey(
        AppUser,
        on_delete=models.SET_NULL,
        db_column='actor_user_id',
        blank=True,
        null=True,
    )
    actor_name = models.CharField(max_length=150)
    club = models.ForeignKey(
        Club,
        on_delete=models.SET_NULL,
        db_column='club_id',
        blank=True,
        null=True,
    )
    metadata_json = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = db_constants.TABLE_ADMIN_AUDIT_LOG
        managed = False
        ordering = ['-created_at']


class VenueLayout(models.Model):
    LAYOUT_MODES = [
        ('local_layout', 'Layout Local'),
        ('eventbrite_reserved_seating', 'Reserved Seating Eventbrite'),
    ]

    id = models.AutoField(primary_key=True)
    event = models.OneToOneField('Event', on_delete=models.CASCADE, related_name='venue_layout')
    layout_mode = models.CharField(max_length=50, choices=LAYOUT_MODES, default='local_layout')
    rows = models.IntegerField(default=0)
    seats_per_row = models.IntegerField(default=0)
    row_prefix = models.CharField(max_length=20, blank=True, default='')
    eventbrite_seat_map_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    eventbrite_source_seat_map_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'infocultura_venue_layout'
        managed = False


class EventSeat(models.Model):
    STATUS_CHOICES = [
        ('available', 'Disponível'),
        ('blocked', 'Bloqueado'),
        ('vip', 'VIP'),
        ('assigned', 'Atribuído'),
    ]

    id = models.AutoField(primary_key=True)
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='seats')
    venue_layout = models.ForeignKey(VenueLayout, on_delete=models.SET_NULL, blank=True, null=True, related_name='seats')
    section_label = models.CharField(max_length=100, blank=True, default='')
    row_label = models.CharField(max_length=50)
    seat_number = models.IntegerField(blank=True, null=True)
    seat_label = models.CharField(max_length=100)
    eventbrite_seat_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    eventbrite_attendee_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    eventbrite_order_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    attendee_name = models.CharField(max_length=255, blank=True, default='')
    attendee_email = models.CharField(max_length=255, blank=True, default='')
    ticket_class_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    ticket_class_name = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='available')
    synced_at = models.DateTimeField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'infocultura_event_seat'
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'section_label', 'row_label', 'seat_label'],
                name='unique_event_section_row_seat_label'
            ),
            models.UniqueConstraint(
                fields=['event', 'eventbrite_seat_id'],
                condition=models.Q(eventbrite_seat_id__isnull=False),
                name='unique_event_eventbrite_seat_id'
            ),
            models.UniqueConstraint(
                fields=['event', 'eventbrite_attendee_id'],
                condition=models.Q(eventbrite_attendee_id__isnull=False),
                name='unique_event_eventbrite_attendee_id'
            )
        ]


class EventSeatSyncIssue(models.Model):
    ISSUE_TYPES = [
        ('unassigned', 'Sem assento atribuído'),
        ('duplicate', 'Participante com múltiplos assentos'),
        ('seat_not_found', 'Assento do Eventbrite inexistente na sala local'),
        ('missing_attendee_id', 'Participante sem ID da Eventbrite'),
    ]

    id = models.AutoField(primary_key=True)
    event = models.ForeignKey('Event', on_delete=models.CASCADE, related_name='seating_issues')
    eventbrite_attendee_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    eventbrite_order_id = models.CharField(max_length=64, blank=True, null=True, default=None)
    attendee_name = models.CharField(max_length=255, blank=True, default='')
    attendee_email = models.CharField(max_length=255, blank=True, default='')
    ticket_class_name = models.CharField(max_length=255, blank=True, default='')
    issue_type = models.CharField(max_length=30, choices=ISSUE_TYPES, default='unassigned')
    synced_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'infocultura_event_seat_sync_issue'
        managed = False
        constraints = [
            models.UniqueConstraint(
                fields=['event', 'eventbrite_attendee_id'],
                condition=models.Q(eventbrite_attendee_id__isnull=False),
                name='unique_event_sync_issue_attendee'
            )
        ]

