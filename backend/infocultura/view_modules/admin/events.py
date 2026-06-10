from __future__ import annotations

from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
import logging

from ...api.response_builders import apply_admin_ordering, apply_date_range_filters, build_csv_response, paginate_queryset
from ...api.serializers import (
    AdminBulkIdsSerializer,
    AdminBulkStatusUpdateSerializer,
    AdminEventReadSerializer,
    AdminEventWriteSerializer,
    EVENT_WORKFLOW_STATUS_ORDER,
    get_role_allowed_workflow_statuses,
    normalize_workflow_status,
)
from ...core.permissions import IsClubAdmin
from ...models import Event, EventCategory, EventRegistration, NewsStatus
from ...service_modules.audit import record_admin_audit_action, record_editorial_action
from ...service_modules.eventbrite import (
    EventbriteAPIError,
    EventbriteConfigurationError,
    create_or_update_eventbrite_event,
    create_eventbrite_ticket_class,
    get_eventbrite_event,
    get_eventbrite_connection_status,
    list_eventbrite_attendees,
    list_eventbrite_orders,
    publish_eventbrite_event,
    sync_event_to_eventbrite,
)
from ...service_modules.workflow import notify_event_workflow_status
from ..admin.common import AdminAuditDestroyMixin, AdminAuditMixin, get_allowed_club_id
from ..admin.list_helpers import read_admin_list_params


class AdminEventListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'event'

    ordering_map = {
        'date_asc': ('event_date', 'start_date', '-id'),
        'date_desc': ('-event_date', '-start_date', '-id'),
        'newest': ('-created_at', '-id'),
        'oldest': ('created_at', 'id'),
        'title_asc': ('title', '-id'),
        'title_desc': ('-title', '-id'),
        'club_asc': ('user__club__name', '-id'),
        'club_desc': ('-user__club__name', '-id'),
        'status_asc': ('status', '-id'),
        'status_desc': ('-status', '-id'),
    }

    def get_queryset(self):
        queryset = Event.objects.select_related('user__club').prefetch_related('categories')
        params = read_admin_list_params(self.request.query_params)
        allowed_club_id = get_allowed_club_id(self.request.user)
        category_id = self.request.query_params.get('category_id')

        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)
        elif params.club_id is not None:
            queryset = queryset.filter(user__club_id=params.club_id)

        if category_id and category_id.isdigit():
            queryset = queryset.filter(categories__id=int(category_id))
        is_active = (self.request.query_params.get('is_active') or '').strip().lower()
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        if params.status:
            queryset = queryset.filter(status__iexact=params.status)
        city = (self.request.query_params.get('city') or '').strip()
        if city:
            queryset = queryset.filter(city__icontains=city)
        location = (self.request.query_params.get('location') or '').strip()
        if location:
            queryset = queryset.filter(location__icontains=location)
        if params.search:
            queryset = queryset.filter(
                Q(title__icontains=params.search)
                | Q(description__icontains=params.search)
                | Q(city__icontains=params.search)
                | Q(location__icontains=params.search)
                | Q(user__club__name__icontains=params.search)
            )

        queryset = apply_date_range_filters(queryset, self.request, date_field='event_date')
        queryset = apply_admin_ordering(
            queryset,
            self.request,
            default_ordering=('event_date', 'start_date', '-id'),
            ordering_map=self.ordering_map,
        )
        return queryset.distinct()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminEventReadSerializer
        return AdminEventWriteSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.title,
                    item.user.club.name if item.user_id and item.user and item.user.club else '',
                    item.status,
                    item.event_date.isoformat() if item.event_date else '',
                    item.start_date.isoformat() if item.start_date else '',
                    item.location,
                    ', '.join(item.categories.values_list('name', flat=True)),
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'title', 'club', 'status', 'event_date', 'start_date', 'location', 'categories'],
                filename='infocultura_events.csv',
            )

        return paginate_queryset(
            queryset,
            request=request,
            serializer_class=self.get_serializer_class(),
            context=self.get_serializer_context(),
        )


class AdminEventDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'event'

    def get_queryset(self):
        queryset = Event.objects.select_related('user__club').prefetch_related('categories')
        allowed_club_id = get_allowed_club_id(self.request.user)

        if allowed_club_id is not None:
            return queryset.filter(user__club_id=allowed_club_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminEventReadSerializer
        return AdminEventWriteSerializer

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        with transaction.atomic():
            EventCategory.objects.filter(event=instance).delete()
            EventRegistration.objects.filter(event=instance).delete()
            self.write_audit_entry(request, action='delete', instance=instance)
            return super().destroy(request, *args, **kwargs)


class AdminEventBulkStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_status = normalize_workflow_status(serializer.validated_data['status'])
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)
        queryset = Event.objects.select_related('user__club').prefetch_related('categories').filter(
            id__in=serializer.validated_data['ids']
        )

        if role_name == 'club_admin':
            queryset = queryset.filter(user__club_id=request.user.club_id)

        items = list(queryset)
        for item in items:
            allowed_statuses = get_role_allowed_workflow_statuses(
                role_name=role_name,
                base_statuses=EVENT_WORKFLOW_STATUS_ORDER,
                current_status=normalize_workflow_status(item.status),
            )
            if target_status not in allowed_statuses:
                return Response(
                    {'message': 'Um ou mais eventos nao podem passar para esse estado.'},
                    status=400,
                )

        updated_items = []
        for item in items:
            previous_status = item.status
            item.status = target_status
            item.updated_at = timezone.now()
            item.save(update_fields=['status', 'updated_at'])
            record_editorial_action(
                content_type='event',
                object_id=item.id,
                from_status=previous_status,
                to_status=target_status,
                actor_user=request.user,
                club_id=item.user.club_id if item.user_id and item.user else None,
            )
            notify_event_workflow_status(
                event=item,
                previous_status=previous_status,
                next_status=target_status,
            )
            # Auto-sync to Eventbrite when transitioning to published
            if normalize_workflow_status(target_status) == 'published':
                sync_event_to_eventbrite(item)
            updated_items.append(item)

        output = AdminEventReadSerializer(updated_items, many=True)
        if updated_items:
            record_admin_audit_action(
                action='bulk_update_status',
                content_type='event',
                summary=f'{len(updated_items)} eventos atualizados',
                actor_user=request.user,
                metadata={'ids': [item.id for item in updated_items], 'status': target_status},
            )
        return Response({'items': output.data, 'updated': len(updated_items)})


class AdminEventBulkDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        queryset = Event.objects.filter(id__in=serializer.validated_data['ids'])
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)
        if role_name == 'club_admin':
            queryset = queryset.filter(user__club_id=request.user.club_id)

        deleted_ids = list(queryset.values_list('id', flat=True))
        deleted_count = len(deleted_ids)
        if deleted_count:
            with transaction.atomic():
                EventCategory.objects.filter(event__in=queryset).delete()
                EventRegistration.objects.filter(event__in=queryset).delete()
                queryset.delete()
            record_admin_audit_action(
                action='bulk_delete',
                content_type='event',
                summary=f'{deleted_count} eventos removidos',
                actor_user=request.user,
                metadata={'ids': deleted_ids},
            )
        return Response({'deleted': deleted_count})


class AdminEventEventbriteSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request, pk: int):
        queryset = Event.objects.select_related('user__club').prefetch_related('categories')
        allowed_club_id = get_allowed_club_id(request.user)
        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)

        try:
            event = queryset.get(pk=pk)
        except Event.DoesNotExist:
            return Response({'message': 'Evento nao encontrado.'}, status=404)

        should_publish = bool(request.data.get('publish', False))
        now = timezone.now()

        try:
            result = create_or_update_eventbrite_event(event)
            publish_payload = None
            if should_publish:
                publish_payload = publish_eventbrite_event(result.event_id)

            event.eventbrite_event_id = result.event_id
            event.eventbrite_url = result.url
            event.eventbrite_status = 'published' if should_publish else result.status
            event.eventbrite_venue_id = result.venue_id or event.eventbrite_venue_id
            event.eventbrite_last_synced_at = now
            event.eventbrite_last_error = ''
            event.updated_at = now
            event.save(
                update_fields=[
                    'eventbrite_event_id',
                    'eventbrite_url',
                    'eventbrite_status',
                    'eventbrite_venue_id',
                    'eventbrite_last_synced_at',
                    'eventbrite_last_error',
                    'updated_at',
                ]
            )
        except (EventbriteConfigurationError, EventbriteAPIError) as error:
            event.eventbrite_last_error = str(error)
            event.updated_at = now
            event.save(update_fields=['eventbrite_last_error', 'updated_at'])
            status_code = getattr(error, 'status_code', None) or 400
            return Response({'message': str(error)}, status=status_code)

        record_admin_audit_action(
            action='eventbrite_sync',
            content_type='event',
            summary=f'Evento sincronizado com Eventbrite: {event.title}',
            actor_user=request.user,
            metadata={
                'event_id': event.id,
                'eventbrite_event_id': event.eventbrite_event_id,
                'publish': should_publish,
            },
        )

        output = AdminEventReadSerializer(event)
        return Response(
            {
                'item': output.data,
                'eventbrite': {
                    'event_id': result.event_id,
                    'url': event.eventbrite_url,
                    'status': event.eventbrite_status,
                    'venue_id': event.eventbrite_venue_id,
                    'ticket_classes': result.ticket_classes or [],
                    'published': should_publish,
                    'publish_payload': publish_payload,
                },
            }
        )


class AdminEventbriteConnectionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        logger = logging.getLogger(__name__)
        try:
            logger.debug(
                'AdminEventbriteConnectionView.get user=%s is_authenticated=%s auth=%s cookies=%s',
                getattr(request, 'user', None),
                getattr(getattr(request, 'user', None), 'is_authenticated', False),
                getattr(request, 'auth', None),
                list(request.COOKIES.keys()),
            )
            payload = get_eventbrite_connection_status()
        except (EventbriteConfigurationError, EventbriteAPIError) as error:
            return Response(
                {
                    'connected': False,
                    'message': str(error),
                },
                status=getattr(error, 'status_code', None) or 400,
            )

        return Response(payload)


class AdminEventEventbriteDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get_event(self, request, pk: int):
        queryset = Event.objects.select_related('user__club')
        allowed_club_id = get_allowed_club_id(request.user)
        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)

        try:
            event = queryset.get(pk=pk)
        except Event.DoesNotExist:
            return None, Response({'message': 'Evento nao encontrado.'}, status=404)

        if not event.eventbrite_event_id:
            return None, Response({'message': 'Este evento ainda nao esta sincronizado com a Eventbrite.'}, status=400)

        return event, None

    def get(self, request, pk: int):
        event, error_response = self.get_event(request, pk)
        if error_response:
            return error_response

        try:
            payload = get_eventbrite_event(event.eventbrite_event_id)
        except (EventbriteConfigurationError, EventbriteAPIError) as error:
            return Response({'message': str(error)}, status=getattr(error, 'status_code', None) or 400)

        return Response(
            {
                'id': payload.get('id') or event.eventbrite_event_id,
                'name': ((payload.get('name') or {}).get('text') or event.title),
                'status': payload.get('status') or '',
                'url': payload.get('url') or event.eventbrite_url,
                'capacity': payload.get('capacity'),
                'ticket_classes': payload.get('ticket_classes') or [],
                'venue': payload.get('venue') or {},
            }
        )


class AdminEventEventbriteTicketClassView(AdminEventEventbriteDetailView):
    def post(self, request, pk: int):
        event, error_response = self.get_event(request, pk)
        if error_response:
            return error_response

        ticket = request.data.get('ticket_class') or request.data
        if not isinstance(ticket, dict):
            return Response({'message': 'Dados do ticket invalidos.'}, status=400)

        try:
            payload = create_eventbrite_ticket_class(event.eventbrite_event_id, ticket)
        except (EventbriteConfigurationError, EventbriteAPIError) as error:
            return Response({'message': str(error)}, status=getattr(error, 'status_code', None) or 400)

        record_admin_audit_action(
            action='eventbrite_ticket_create',
            content_type='event',
            summary=f'Ticket Eventbrite criado: {event.title}',
            actor_user=request.user,
            metadata={'event_id': event.id, 'eventbrite_event_id': event.eventbrite_event_id},
        )
        return Response({'ticket_class': payload})


class AdminEventEventbriteAttendeesView(AdminEventEventbriteDetailView):
    def get(self, request, pk: int):
        event, error_response = self.get_event(request, pk)
        if error_response:
            return error_response

        try:
            payload = list_eventbrite_attendees(
                event.eventbrite_event_id,
                continuation=(request.query_params.get('continuation') or '').strip(),
            )
        except (EventbriteConfigurationError, EventbriteAPIError) as error:
            return Response({'message': str(error)}, status=getattr(error, 'status_code', None) or 400)

        attendees = payload.get('attendees') or []
        return Response(
            {
                'attendees': [
                    {
                        'id': attendee.get('id'),
                        'name': ((attendee.get('profile') or {}).get('name') or attendee.get('name') or ''),
                        'email': ((attendee.get('profile') or {}).get('email') or attendee.get('email') or ''),
                        'status': attendee.get('status') or '',
                        'checked_in': bool(attendee.get('checked_in')),
                        'ticket_class_name': attendee.get('ticket_class_name') or '',
                        'ticket_class_id': attendee.get('ticket_class_id') or '',
                        'order_id': attendee.get('order_id') or '',
                        'created': attendee.get('created') or '',
                    }
                    for attendee in attendees
                ],
                'pagination': payload.get('pagination') or {},
                'eventbrite_manage_attendees_url': (
                    f'https://www.eventbrite.com/manage/events/{event.eventbrite_event_id}/attendees'
                ),
            }
        )


class AdminEventEventbriteOrdersView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    allowed_refund_statuses = {'completed', 'pending', 'outside_policy', 'disputed', 'denied'}

    def get(self, request, pk: int):
        queryset = Event.objects.select_related('user__club')
        allowed_club_id = get_allowed_club_id(request.user)
        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)

        try:
            event = queryset.get(pk=pk)
        except Event.DoesNotExist:
            return Response({'message': 'Evento nao encontrado.'}, status=404)

        if not event.eventbrite_event_id:
            return Response({'message': 'Este evento ainda nao esta sincronizado com a Eventbrite.'}, status=400)

        refund_status = (request.query_params.get('refund_request_statuses') or '').strip()
        if refund_status and refund_status not in self.allowed_refund_statuses:
            return Response({'message': 'Estado de reembolso invalido.'}, status=400)

        try:
            payload = list_eventbrite_orders(
                event.eventbrite_event_id,
                refund_request_statuses=refund_status,
                continuation=(request.query_params.get('continuation') or '').strip(),
            )
        except (EventbriteConfigurationError, EventbriteAPIError) as error:
            return Response({'message': str(error)}, status=getattr(error, 'status_code', None) or 400)

        orders = payload.get('orders') or []
        normalized_orders = [
            {
                'id': order.get('id'),
                'name': order.get('name') or order.get('first_name') or '',
                'email': order.get('email') or '',
                'status': order.get('status') or '',
                'created': order.get('created') or '',
                'changed': order.get('changed') or '',
                'costs': order.get('costs') or {},
                'refund_request': order.get('refund_request') or {},
            }
            for order in orders
        ]
        return Response(
            {
                'orders': normalized_orders,
                'pagination': payload.get('pagination') or {},
                'eventbrite_manage_orders_url': (
                    f'https://www.eventbrite.com/manage/events/{event.eventbrite_event_id}/orders'
                ),
            }
        )
