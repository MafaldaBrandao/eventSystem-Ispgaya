from django.utils import timezone
from rest_framework import serializers

from ..models import AppUser, Book, Category, Club, Event, EventCategory, Session
from ..services import (
    build_activity_calendar_payload,
    get_event_registration_summary,
    get_session_registration_summary,
    list_editorial_history,
    notify_event_workflow_status,
    record_editorial_action,
    validate_date_interval,
)
from ..service_modules.eventbrite import sync_event_to_eventbrite
from ..core.security import validate_entity_name
from ..core.sanitizers import clean_text
from .serializers_news import EditorialHistorySerializer
from .serializers_shared import ClubScopedWriteMixin
from .serializers_workflow import (
    EVENT_WORKFLOW_STATUS_ORDER,
    get_role_allowed_workflow_statuses,
    normalize_workflow_status,
)


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description', 'created_at', 'updated_at']


class BookSerializer(serializers.ModelSerializer):
    club_id = serializers.IntegerField(read_only=True, allow_null=True)
    club_name = serializers.CharField(source='club.name', read_only=True, allow_null=True)

    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'publisher',
            'publication_year',
            'cover_image',
            'summary',
            'is_active',
            'is_featured',
            'created_at',
            'club_id',
            'club_name',
        ]


class SessionSerializer(serializers.ModelSerializer):
    club_id = serializers.IntegerField(read_only=True, allow_null=True)
    club_name = serializers.CharField(source='club.name', read_only=True, allow_null=True)
    enable_registrations = serializers.BooleanField(read_only=True)
    registration_capacity = serializers.IntegerField(read_only=True, allow_null=True)
    confirmed_registrations = serializers.SerializerMethodField()
    waitlist_registrations = serializers.SerializerMethodField()
    remaining_slots = serializers.SerializerMethodField()
    registration_state = serializers.SerializerMethodField()
    google_calendar_url = serializers.SerializerMethodField()
    outlook_calendar_url = serializers.SerializerMethodField()

    class Meta:
        model = Session
        fields = [
            'id',
            'name',
            'title',
            'description',
            'is_active',
            'session_date',
            'start_date',
            'end_date',
            'location',
            'enable_registrations',
            'registration_capacity',
            'created_at',
            'updated_at',
            'club_id',
            'club_name',
            'confirmed_registrations',
            'waitlist_registrations',
            'remaining_slots',
            'registration_state',
            'google_calendar_url',
            'outlook_calendar_url',
        ]

    def _get_summary(self, obj):
        cached = getattr(obj, '_registration_summary_cache', None)
        if cached is None:
            cached = get_session_registration_summary(session=obj)
            setattr(obj, '_registration_summary_cache', cached)
        return cached

    def get_confirmed_registrations(self, obj):
        return self._get_summary(obj).confirmed_count

    def get_waitlist_registrations(self, obj):
        return self._get_summary(obj).waitlist_count

    def get_remaining_slots(self, obj):
        return self._get_summary(obj).remaining_slots

    def get_registration_state(self, obj):
        return self._get_summary(obj).registration_state

    def get_google_calendar_url(self, obj):
        payload = build_activity_calendar_payload(
            activity_type='session',
            activity_id=obj.id
        )
        return payload.get('google_url')

    def get_outlook_calendar_url(self, obj):
        payload = build_activity_calendar_payload(
            activity_type='session',
            activity_id=obj.id
        )
        return payload.get('outlook_url')


class EventSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(read_only=True)
    club_id = serializers.SerializerMethodField()
    club_name = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='user.name', read_only=True)
    categories = CategorySerializer(many=True, read_only=True)
    category_ids = serializers.SerializerMethodField()
    enable_registrations = serializers.BooleanField(read_only=True)
    registration_capacity = serializers.IntegerField(read_only=True, allow_null=True)
    confirmed_registrations = serializers.SerializerMethodField()
    waitlist_registrations = serializers.SerializerMethodField()
    remaining_slots = serializers.SerializerMethodField()
    registration_state = serializers.SerializerMethodField()
    google_calendar_url = serializers.SerializerMethodField()
    outlook_calendar_url = serializers.SerializerMethodField()

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'is_active',
            'event_date',
            'start_date',
            'end_date',
            'image',
            'is_external',
            'enable_registrations',
            'registration_capacity',
            'status',
            'created_at',
            'updated_at',
            'city',
            'location',
            'eventbrite_event_id',
            'eventbrite_url',
            'eventbrite_status',
            'eventbrite_last_synced_at',
            'eventbrite_last_error',
            'eventbrite_venue_id',
            'eventbrite_venue',
            'eventbrite_ticket_classes',
            'user_id',
            'club_id',
            'club_name',
            'owner_name',
            'categories',
            'category_ids',
            'confirmed_registrations',
            'waitlist_registrations',
            'remaining_slots',
            'registration_state',
            'google_calendar_url',
            'outlook_calendar_url',
        ]

    def get_club_id(self, obj):
        return obj.user.club_id if obj.user_id and obj.user else None

    def get_club_name(self, obj):
        if not obj.user_id or not obj.user or not obj.user.club:
            return None
        return obj.user.club.name

    def get_category_ids(self, obj):
        return list(obj.categories.values_list('id', flat=True))

    def _get_summary(self, obj):
        cached = getattr(obj, '_registration_summary_cache', None)
        if cached is None:
            cached = get_event_registration_summary(event=obj)
            setattr(obj, '_registration_summary_cache', cached)
        return cached

    def get_confirmed_registrations(self, obj):
        return self._get_summary(obj).confirmed_count

    def get_waitlist_registrations(self, obj):
        return self._get_summary(obj).waitlist_count

    def get_remaining_slots(self, obj):
        return self._get_summary(obj).remaining_slots

    def get_registration_state(self, obj):
        return self._get_summary(obj).registration_state

    def get_google_calendar_url(self, obj):
        payload = build_activity_calendar_payload(
            activity_type='event',
            activity_id=obj.id
        )
        return payload.get('google_url')

    def get_outlook_calendar_url(self, obj):
        payload = build_activity_calendar_payload(
            activity_type='event',
            activity_id=obj.id
        )
        return payload.get('outlook_url')


class AdminEventReadSerializer(EventSerializer):
    editorial_history = serializers.SerializerMethodField()

    class Meta(EventSerializer.Meta):
        fields = EventSerializer.Meta.fields + ['editorial_history']

    def get_editorial_history(self, obj):
        history = list_editorial_history(content_type='event', object_id=obj.id)
        return EditorialHistorySerializer(history, many=True).data


class ClubScopedWriteSerializer(ClubScopedWriteMixin, serializers.ModelSerializer):
    pass


class AdminBookWriteSerializer(ClubScopedWriteSerializer):
    class Meta:
        model = Book
        fields = [
            'id',
            'title',
            'author',
            'publisher',
            'publication_year',
            'cover_image',
            'summary',
            'is_featured',
            'created_at',
            'club_id',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        if 'club' not in attrs:
            raw_club_id = None
            if hasattr(self, 'initial_data'):
                raw_club_id = self.initial_data.get('club_id')
            if raw_club_id in (None, ''):
                raw_club_id = self.context['request'].data.get('club_id')
            if raw_club_id not in (None, ''):
                try:
                    attrs['club'] = Club.objects.get(pk=raw_club_id)
                except (Club.DoesNotExist, TypeError, ValueError) as error:
                    raise serializers.ValidationError({'club_id': 'O clube e obrigatorio.'}) from error

        self.resolve_club_scope(attrs)
        return attrs

    def create(self, validated_data):
        validated_data.setdefault('created_at', timezone.now())
        return Book.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.save()
        return instance

    def to_representation(self, instance):
        return BookSerializer(instance).data


class AdminSessionWriteSerializer(ClubScopedWriteSerializer):
    enable_registrations = serializers.BooleanField(required=False)
    registration_capacity = serializers.IntegerField(required=False, allow_null=True)

    class Meta:
        model = Session
        fields = [
            'id',
            'name',
            'title',
            'description',
            'session_date',
            'start_date',
            'end_date',
            'location',
            'created_at',
            'enable_registrations',
            'registration_capacity',
            'club_id',
        ]
        read_only_fields = ['id']

    def validate(self, attrs):
        if 'club' not in attrs:
            raw_club_id = None
            if hasattr(self, 'initial_data'):
                raw_club_id = self.initial_data.get('club_id')
            if raw_club_id in (None, ''):
                raw_club_id = self.context['request'].data.get('club_id')
            if raw_club_id not in (None, ''):
                try:
                    attrs['club'] = Club.objects.get(pk=raw_club_id)
                except (Club.DoesNotExist, TypeError, ValueError) as error:
                    raise serializers.ValidationError({'club_id': 'O clube e obrigatorio.'}) from error

        self.resolve_club_scope(attrs)
        if 'name' in attrs:
            try:
                attrs['name'] = validate_entity_name(attrs['name'], field_label='O nome da sessao')
            except ValueError as error:
                raise serializers.ValidationError({'name': str(error)}) from error
        start_date = attrs.get('start_date') or getattr(self.instance, 'start_date', None)
        end_date = attrs.get('end_date') or getattr(self.instance, 'end_date', None)

        try:
            validate_date_interval(start_date, end_date)
        except ValueError as error:
            raise serializers.ValidationError({'end_date': str(error)})

        enable_registrations = attrs.get(
            'enable_registrations',
            getattr(self.instance, 'enable_registrations', False),
        )
        registration_capacity = attrs.get(
            'registration_capacity',
            getattr(self.instance, 'registration_capacity', None),
        )
        if registration_capacity is not None and registration_capacity <= 0:
            raise serializers.ValidationError(
                {'registration_capacity': 'A capacidade tem de ser superior a zero.'}
            )
        if enable_registrations and registration_capacity is None:
            raise serializers.ValidationError(
                {'registration_capacity': 'Define a lotacao para ativar inscricoes.'}
            )

        if 'location' in attrs:
            attrs['location'] = clean_text(attrs['location'], allowed_tags=None)

        return attrs

    def create(self, validated_data):
        now = timezone.now()
        validated_data.setdefault('created_at', now)
        validated_data['updated_at'] = now
        return Session.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.updated_at = timezone.now()
        instance.save()
        return instance

    def to_representation(self, instance):
        return SessionSerializer(instance).data


class AdminEventWriteSerializer(serializers.ModelSerializer):
    club_id = serializers.PrimaryKeyRelatedField(
        source='club',
        queryset=Club.objects.all(),
        required=False,
    )
    enable_registrations = serializers.BooleanField(required=False)
    registration_capacity = serializers.IntegerField(required=False, allow_null=True)
    category_ids = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        many=True,
        required=False,
        source='categories_payload',
    )
    eventbrite_venue = serializers.JSONField(required=False, allow_null=True)
    eventbrite_ticket_classes = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Event
        fields = [
            'id',
            'title',
            'description',
            'event_date',
            'start_date',
            'end_date',
            'image',
            'is_external',
            'enable_registrations',
            'registration_capacity',
            'status',
            'created_at',
            'city',
            'location',
            'eventbrite_venue_id',
            'eventbrite_venue',
            'eventbrite_ticket_classes',
            'club_id',
            'category_ids',
        ]
        read_only_fields = ['id']

    def _resolve_owner(self, club: Club):
        request_user = self.context['request'].user
        if request_user.club_id == club.id:
            return request_user

        owner = AppUser.objects.filter(club=club, is_active=True).order_by('id').first()
        if owner is None:
            raise serializers.ValidationError(
                {'club_id': 'O clube precisa de pelo menos um utilizador ativo associado.'}
            )

        return owner

    def validate(self, attrs):
        request = self.context['request']
        user = request.user
        role_name = getattr(getattr(user, 'role', None), 'name', None)

        if role_name == 'club_admin':
            if not user.club_id:
                raise serializers.ValidationError(
                    {'club_id': 'O club_admin tem de ter um clube associado.'}
                )
            club = user.club
        else:
            club = attrs.get('club')
            if club is None and self.instance and self.instance.user_id and self.instance.user:
                club = self.instance.user.club

        if club is None:
            raise serializers.ValidationError({'club_id': 'O clube e obrigatorio.'})

        start_date = attrs.get('start_date') or getattr(self.instance, 'start_date', None)
        end_date = attrs.get('end_date') or getattr(self.instance, 'end_date', None)

        try:
            validate_date_interval(start_date, end_date)
        except ValueError as error:
            raise serializers.ValidationError({'end_date': str(error)})

        enable_registrations = attrs.get(
            'enable_registrations',
            getattr(self.instance, 'enable_registrations', False),
        )
        registration_capacity = attrs.get(
            'registration_capacity',
            getattr(self.instance, 'registration_capacity', None),
        )
        if registration_capacity is not None and registration_capacity <= 0:
            raise serializers.ValidationError(
                {'registration_capacity': 'A capacidade tem de ser superior a zero.'}
            )
        if enable_registrations and registration_capacity is None:
            raise serializers.ValidationError(
                {'registration_capacity': 'Define a lotacao para ativar inscricoes.'}
            )
        venue = attrs.get('eventbrite_venue')
        if venue is not None and not isinstance(venue, dict):
            raise serializers.ValidationError({'eventbrite_venue': 'A sala tem de ser um objeto JSON.'})
        # sanitize text inputs to prevent XSS
        for field in ('title', 'description', 'city', 'location'):
            if field in attrs:
                attrs[field] = clean_text(attrs[field], allowed_tags=None)
        # sanitize eventbrite venue fields
        if isinstance(venue, dict):
            for k, v in list(venue.items()):
                if isinstance(v, str):
                    venue[k] = clean_text(v, allowed_tags=None)
            attrs['eventbrite_venue'] = venue
        tickets = attrs.get('eventbrite_ticket_classes')
        if tickets is not None:
            if not isinstance(tickets, list):
                raise serializers.ValidationError({'eventbrite_ticket_classes': 'Os bilhetes tem de ser uma lista.'})
            for index, ticket in enumerate(tickets):
                if not isinstance(ticket, dict):
                    raise serializers.ValidationError(
                        {'eventbrite_ticket_classes': f'O bilhete {index + 1} tem de ser um objeto.'}
                    )
                if not str(ticket.get('name') or '').strip():
                    raise serializers.ValidationError(
                        {'eventbrite_ticket_classes': f'O bilhete {index + 1} precisa de nome.'}
                    )
                # sanitize ticket names
                ticket['name'] = clean_text(ticket.get('name') or '', allowed_tags=None)
                try:
                    quantity = int(ticket.get('quantity_total') or ticket.get('quantity') or 0)
                except (TypeError, ValueError) as error:
                    raise serializers.ValidationError(
                        {'eventbrite_ticket_classes': f'A quantidade do bilhete {index + 1} e invalida.'}
                    ) from error
                if quantity <= 0:
                    raise serializers.ValidationError(
                        {'eventbrite_ticket_classes': f'A quantidade do bilhete {index + 1} tem de ser superior a zero.'}
                    )

        next_status = normalize_workflow_status(
            attrs.get('status') or getattr(self.instance, 'status', None)
        )
        current_status = normalize_workflow_status(getattr(self.instance, 'status', None))
        allowed_statuses = get_role_allowed_workflow_statuses(
            role_name=role_name,
            base_statuses=EVENT_WORKFLOW_STATUS_ORDER,
            current_status=current_status,
        )
        created_at = attrs.get('created_at')
        is_future_publication = (
            next_status == 'published'
            and created_at is not None
            and created_at > timezone.now()
        )
        if next_status not in allowed_statuses and not is_future_publication:
            raise serializers.ValidationError(
                {'status': 'Nao tens permissao para colocar este evento nesse estado.'}
            )

        attrs['status'] = next_status
        attrs['resolved_club'] = club
        return attrs

    def create(self, validated_data):
        club = validated_data.pop('resolved_club')
        validated_data.pop('club', None)
        categories = validated_data.pop('categories_payload', [])
        owner = self._resolve_owner(club)
        request_user = self.context['request'].user
        now = timezone.now()
        validated_data['user'] = owner
        validated_data.setdefault('created_at', now)
        validated_data['updated_at'] = now
        event = Event.objects.create(**validated_data)

        if categories:
            EventCategory.objects.bulk_create(
                [EventCategory(event=event, category=category) for category in categories]
            )
        next_status = event.status
        record_editorial_action(
            content_type='event',
            object_id=event.id,
            from_status=None,
            to_status=next_status,
            actor_user=request_user,
            club_id=club.id,
        )
        notify_event_workflow_status(event=event, previous_status=None, next_status=next_status)
        
        # Auto-sync to Eventbrite when event is published
        if next_status == 'published':
            sync_event_to_eventbrite(event)
        
        return event

    def update(self, instance, validated_data):
        club = validated_data.pop('resolved_club')
        validated_data.pop('club', None)
        categories = validated_data.pop('categories_payload', None)
        owner = self._resolve_owner(club)
        request_user = self.context['request'].user
        previous_status = instance.status

        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.user = owner
        instance.updated_at = timezone.now()
        instance.save()

        if categories is not None:
            EventCategory.objects.filter(event=instance).delete()
            EventCategory.objects.bulk_create(
                [EventCategory(event=instance, category=category) for category in categories]
            )
        
        # Track status change
        status_changed = normalize_workflow_status(previous_status) != normalize_workflow_status(instance.status)
        
        if status_changed:
            record_editorial_action(
                content_type='event',
                object_id=instance.id,
                from_status=previous_status,
                to_status=instance.status,
                actor_user=request_user,
                club_id=club.id,
            )
            notify_event_workflow_status(
                event=instance,
                previous_status=previous_status,
                next_status=instance.status,
            )
            
            # Auto-sync to Eventbrite when transitioning to published
            if normalize_workflow_status(instance.status) == 'published':
                sync_event_to_eventbrite(instance)
        
        return instance

    def to_representation(self, instance):
        return EventSerializer(instance).data


class AdminCategoryWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'description']
        read_only_fields = ['id']

    def validate_name(self, value):
        try:
            return validate_entity_name(value, field_label='O nome da categoria')
        except ValueError as error:
            raise serializers.ValidationError(str(error)) from error

    def create(self, validated_data):
        now = timezone.now()
        validated_data.setdefault('created_at', now)
        validated_data['updated_at'] = now
        return Category.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)

        instance.updated_at = timezone.now()
        instance.save()
        return instance

    def to_representation(self, instance):
        return CategorySerializer(instance).data
