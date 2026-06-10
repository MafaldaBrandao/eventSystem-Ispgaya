from __future__ import annotations

from django.utils import timezone
from rest_framework import permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from ...api.serializers_activities import AdminEventWriteSerializer, EventSerializer
from ...models import Event, EventCategory
from ...service_modules.eventbrite import (
    create_or_update_eventbrite_event,
    publish_eventbrite_event,
    unpublish_eventbrite_event,
    delete_eventbrite_event,
    sync_event_to_eventbrite,
    get_eventbrite_connection_status,
    list_eventbrite_organization_events,
    EventbriteConfigurationError,
    EventbriteAPIError,
)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def create_event(request):
    serializer = AdminEventWriteSerializer(data=request.data, context={"request": request})
    serializer.is_valid(raise_exception=True)
    event = serializer.save()
    # If created as published, sync automatically
    if event.status == "published":
        sync_event_to_eventbrite(event)
    return Response(EventSerializer(event).data)


@api_view(["PATCH"])
@permission_classes([permissions.IsAuthenticated])
def update_event(request, pk: int):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({"message": "Evento nao encontrado."}, status=404)

    serializer = AdminEventWriteSerializer(event, data=request.data, partial=True, context={"request": request})
    serializer.is_valid(raise_exception=True)
    event = serializer.save()
    return Response(EventSerializer(event).data)


@api_view(["DELETE"])
@permission_classes([permissions.IsAuthenticated])
def delete_event(request, pk: int):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({"message": "Evento nao encontrado."}, status=404)

    # If synced on Eventbrite, attempt to delete there first
    if getattr(event, "eventbrite_event_id", None):
        try:
            delete_eventbrite_event(event.eventbrite_event_id)
        except Exception:
            pass

    event.delete()
    return Response({"deleted": True})


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def publish_event(request, pk: int):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({"message": "Evento nao encontrado."}, status=404)

    # create/update on Eventbrite
    try:
        result = create_or_update_eventbrite_event(event)
        publish_payload = publish_eventbrite_event(result.event_id)

        now = timezone.now()
        event.eventbrite_event_id = result.event_id
        event.eventbrite_url = result.url
        event.eventbrite_status = 'published'
        event.eventbrite_venue_id = result.venue_id or event.eventbrite_venue_id
        event.eventbrite_last_synced_at = now
        event.eventbrite_last_error = ''
        event.updated_at = now
        event.save(update_fields=['eventbrite_event_id', 'eventbrite_url', 'eventbrite_status', 'eventbrite_venue_id', 'eventbrite_last_synced_at', 'eventbrite_last_error', 'updated_at'])

        return Response({
            'item': EventSerializer(event).data,
            'eventbrite': {
                'event_id': result.event_id,
                'url': event.eventbrite_url,
                'status': event.eventbrite_status,
                'venue_id': event.eventbrite_venue_id,
                'ticket_classes': result.ticket_classes or [],
                'published': True,
                'publish_payload': publish_payload,
            },
        })
    except Exception as error:
        return Response({'message': str(error)}, status=400)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def unpublish_event(request, pk: int):
    try:
        event = Event.objects.get(pk=pk)
    except Event.DoesNotExist:
        return Response({"message": "Evento nao encontrado."}, status=404)

    if not getattr(event, 'eventbrite_event_id', None):
        return Response({'message': 'Evento nao sincronizado com Eventbrite.'}, status=400)

    try:
        payload = unpublish_eventbrite_event(event.eventbrite_event_id)
        now = timezone.now()
        event.eventbrite_status = 'draft'
        event.eventbrite_last_synced_at = now
        event.eventbrite_last_error = ''
        event.updated_at = now
        event.save(update_fields=['eventbrite_status', 'eventbrite_last_synced_at', 'eventbrite_last_error', 'updated_at'])
        return Response({'item': EventSerializer(event).data, 'unpublish_payload': payload})
    except Exception as error:
        return Response({'message': str(error)}, status=400)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def connection(request):
    try:
        status = get_eventbrite_connection_status()
        return Response(status)
    except EventbriteConfigurationError as error:
        return Response({'connected': False, 'message': str(error)}, status=400)
    except EventbriteAPIError as error:
        return Response({'connected': False, 'message': str(error)}, status=502)
    except Exception:
        return Response({'connected': False, 'message': 'Erro ao contactar a Eventbrite.'}, status=500)


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def events_list(request):
    """List all events from the Eventbrite organization."""
    try:
        events = list_eventbrite_organization_events()
        return Response({
            'count': len(events),
            'events': events,
        })
    except EventbriteConfigurationError as error:
        return Response({'message': str(error)}, status=400)
    except EventbriteAPIError as error:
        return Response({'message': str(error)}, status=502)
    except Exception as error:
        return Response({'message': f'Erro ao listar eventos: {str(error)}'}, status=500)


@api_view(["GET"])
@permission_classes([permissions.AllowAny])
def events_list_public(request):
    """List all public events from the Eventbrite organization (no authentication required)."""
    try:
        events = list_eventbrite_organization_events()
        return Response({
            'count': len(events),
            'events': events,
        })
    except EventbriteConfigurationError as error:
        return Response({'message': str(error), 'events': []}, status=200)
    except EventbriteAPIError as error:
        return Response({'message': str(error), 'events': []}, status=200)
    except Exception as error:
        return Response({'message': f'Erro ao listar eventos: {str(error)}', 'events': []}, status=200)
