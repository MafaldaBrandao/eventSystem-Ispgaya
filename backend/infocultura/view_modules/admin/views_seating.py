from __future__ import annotations

import logging
import copy
import json
from django.db import transaction
from django.utils import timezone
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ...core.permissions import IsClubAdmin
from ...models import Event, VenueLayout, EventSeat, EventSeatSyncIssue
from ...service_modules.eventbrite import (
    list_eventbrite_attendees,
    normalize_eventbrite_attendee,
    get_eventbrite_seat_map,
    EventbriteAPIError
)
from ..admin.common import get_allowed_club_id

logger = logging.getLogger(__name__)


class AdminEventSeatingView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get(self, request, event_id: int):
        allowed_club_id = get_allowed_club_id(request.user)
        queryset = Event.objects.all()
        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)
        try:
            event = queryset.get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'message': 'Evento nao encontrado.'}, status=404)

        try:
            layout = event.venue_layout
            layout_data = {
                'id': layout.id,
                'layout_mode': layout.layout_mode,
                'rows': layout.rows,
                'seats_per_row': layout.seats_per_row,
                'row_prefix': layout.row_prefix,
                'eventbrite_seat_map_id': layout.eventbrite_seat_map_id,
                'notes': layout.notes,
            }
        except VenueLayout.DoesNotExist:
            layout_data = None

        seats = EventSeat.objects.filter(event=event).order_by('row_label', 'seat_number', 'id')
        seats_data = []
        for seat in seats:
            seats_data.append({
                'id': seat.id,
                'section_label': seat.section_label,
                'row_label': seat.row_label,
                'seat_number': seat.seat_number,
                'seat_label': seat.seat_label,
                'eventbrite_seat_id': seat.eventbrite_seat_id,
                'eventbrite_attendee_id': seat.eventbrite_attendee_id,
                'eventbrite_order_id': seat.eventbrite_order_id,
                'attendee_name': seat.attendee_name,
                'attendee_email': seat.attendee_email,
                'ticket_class_name': seat.ticket_class_name,
                'status': seat.status,
            })

        issues = EventSeatSyncIssue.objects.filter(event=event).order_by('-created_at')
        issues_data = []
        for issue in issues:
            issues_data.append({
                'id': issue.id,
                'eventbrite_attendee_id': issue.eventbrite_attendee_id,
                'eventbrite_order_id': issue.eventbrite_order_id,
                'attendee_name': issue.attendee_name,
                'attendee_email': issue.attendee_email,
                'ticket_class_name': issue.ticket_class_name,
                'issue_type': issue.issue_type,
            })

        return Response({
            'venue_layout': layout_data,
            'seats': seats_data,
            'sync_issues': issues_data,
        })

    @transaction.atomic
    def post(self, request, event_id: int):
        allowed_club_id = get_allowed_club_id(request.user)
        queryset = Event.objects.all()
        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)
        try:
            event = queryset.get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'message': 'Evento nao encontrado.'}, status=404)

        layout_mode = request.data.get('layout_mode', 'local_layout')
        rows = int(request.data.get('rows', 0))
        seats_per_row = int(request.data.get('seats_per_row', 0))
        row_prefix = request.data.get('row_prefix', '')
        notes = request.data.get('notes', '')
        eventbrite_seat_map_id = request.data.get('eventbrite_seat_map_id')

        # Get or create layout
        layout, created = VenueLayout.objects.get_or_create(
            event=event,
            defaults={
                'layout_mode': layout_mode,
                'rows': rows,
                'seats_per_row': seats_per_row,
                'row_prefix': row_prefix,
                'notes': notes,
                'eventbrite_seat_map_id': eventbrite_seat_map_id,
            }
        )

        if not created:
            layout.layout_mode = layout_mode
            layout.rows = rows
            layout.seats_per_row = seats_per_row
            layout.row_prefix = row_prefix
            layout.notes = notes
            layout.eventbrite_seat_map_id = eventbrite_seat_map_id
            layout.save()

        # Generate or sync seats
        if layout_mode == 'local_layout':
            def build_row_label(prefix: str, index: int) -> str:
                letter = chr(65 + index)
                prefix_part = prefix.strip() if prefix else 'Fila'
                return f"{prefix_part} {letter}"

            new_seats_coords = set()
            for r_idx in range(rows):
                r_lbl = build_row_label(row_prefix, r_idx)
                for s_num in range(1, seats_per_row + 1):
                    new_seats_coords.add(("", r_lbl, str(s_num)))

            # Check existing seats to avoid deleting assigned seats
            existing_seats = EventSeat.objects.filter(event=event)
            for seat in existing_seats:
                coord = (seat.section_label or "", seat.row_label, seat.seat_label)
                if seat.status == 'assigned' and coord not in new_seats_coords:
                    return Response({
                        'message': f"Não é possível reduzir o layout porque o lugar '{seat.row_label}-{seat.seat_label}' está atribuído."
                    }, status=400)

            # Clean up deleted seats (safely since we checked none are assigned)
            for seat in existing_seats:
                coord = (seat.section_label or "", seat.row_label, seat.seat_label)
                if coord not in new_seats_coords:
                    seat.delete()

            # Create or keep remaining seats
            for r_idx in range(rows):
                r_lbl = build_row_label(row_prefix, r_idx)
                for s_num in range(1, seats_per_row + 1):
                    EventSeat.objects.get_or_create(
                        event=event,
                        section_label="",
                        row_label=r_lbl,
                        seat_label=str(s_num),
                        defaults={
                            'venue_layout': layout,
                            'seat_number': s_num,
                            'status': 'available',
                        }
                    )

        return self.get(request, event_id)


class AdminEventSeatingPaintView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    @transaction.atomic
    def post(self, request, event_id: int):
        allowed_club_id = get_allowed_club_id(request.user)
        queryset = Event.objects.all()
        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)
        try:
            event = queryset.get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'message': 'Evento nao encontrado.'}, status=404)

        seat_id = request.data.get('seat_id')
        status = request.data.get('status')

        if not seat_id or status not in ['available', 'blocked', 'vip', 'assigned', 'held']:
            return Response({'message': 'Dados invalidos.'}, status=400)

        try:
            seat = EventSeat.objects.select_for_update().get(pk=seat_id, event=event)
        except EventSeat.DoesNotExist:
            return Response({'message': 'Assento nao encontrado.'}, status=404)

        if seat.eventbrite_attendee_id is not None:
            return Response({'message': 'Nao e possivel alterar o estado de um lugar atribuido a um participante do Eventbrite.'}, status=400)

        if status in ['held', 'assigned']:
            seat.status = 'assigned'
            seat.save(update_fields=['status', 'updated_at'])
        else:
            seat.status = status
            seat.eventbrite_attendee_id = None
            seat.eventbrite_order_id = None
            seat.attendee_name = ''
            seat.attendee_email = ''
            seat.ticket_class_id = None
            seat.ticket_class_name = ''
            seat.save(update_fields=[
                'status',
                'eventbrite_attendee_id',
                'eventbrite_order_id',
                'attendee_name',
                'attendee_email',
                'ticket_class_id',
                'ticket_class_name',
                'updated_at'
            ])

        return Response({
            'message': 'Assento atualizado com sucesso.',
            'seat_id': seat.id,
            'status': seat.status
        })


class AdminEventSeatingSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    @transaction.atomic
    def post(self, request, event_id: int):
        allowed_club_id = get_allowed_club_id(request.user)
        queryset = Event.objects.all()
        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)
        try:
            event = queryset.get(pk=event_id)
        except Event.DoesNotExist:
            return Response({'message': 'Evento nao encontrado.'}, status=404)

        if not event.eventbrite_event_id:
            return Response({'message': 'Evento nao sincronizado com o Eventbrite.'}, status=400)

        # Step 1: Sync Seat Map if layout mode is eventbrite_reserved_seating
        layout_mode = 'local_layout'
        try:
            venue_layout = event.venue_layout
            layout_mode = venue_layout.layout_mode
        except VenueLayout.DoesNotExist:
            venue_layout = None

        if layout_mode == 'eventbrite_reserved_seating':
            eb_seats = get_eventbrite_seat_map(event.eventbrite_event_id)
            for eb_seat in eb_seats:
                seat_id = eb_seat.get('id')
                section = eb_seat.get('section', '')
                row = eb_seat.get('row', '')
                seat_lbl = eb_seat.get('seat', '')
                try:
                    seat_num = int(seat_lbl)
                except (TypeError, ValueError):
                    seat_num = None

                # Search by eventbrite_seat_id or labels to prevent duplicate key constraint issues
                seat_obj = EventSeat.objects.filter(event=event, eventbrite_seat_id=seat_id).first()
                if not seat_obj:
                    seat_obj = EventSeat.objects.filter(
                        event=event,
                        section_label=section,
                        row_label=row,
                        seat_label=seat_lbl
                    ).first()

                if seat_obj:
                    seat_obj.eventbrite_seat_id = seat_id
                    seat_obj.venue_layout = venue_layout
                    seat_obj.seat_number = seat_num
                    seat_obj.save()
                else:
                    EventSeat.objects.create(
                        event=event,
                        venue_layout=venue_layout,
                        eventbrite_seat_id=seat_id,
                        section_label=section,
                        row_label=row,
                        seat_label=seat_lbl,
                        seat_number=seat_num,
                        status='available'
                    )

        # Step 2: Fetch all attendees from Eventbrite
        try:
            attendees = []
            continuation = ''
            while True:
                res = list_eventbrite_attendees(event.eventbrite_event_id, continuation=continuation)
                attendees.extend(res.get('attendees', []))
                pagination = res.get('pagination', {})
                if pagination.get('has_more_items') and pagination.get('continuation'):
                    continuation = pagination['continuation']
                else:
                    break
        except EventbriteAPIError as err:
            return Response({'message': f'Erro ao comunicar com a Eventbrite: {str(err)}'}, status=500)

        # Helper to mask attendee payload for safe logging
        def mask_attendee_payload(p: dict) -> dict:
            masked = copy.deepcopy(p)
            profile = masked.get('profile', {})
            if profile:
                if 'email' in profile:
                    profile['email'] = '***@***.***'
                for k in ['name', 'first_name', 'last_name']:
                    if k in profile:
                        profile[k] = '***'
            return masked

        # Process attendees
        for att in attendees:
            # Mask and log payload securely
            logger.debug("Sincronizando participante do Eventbrite: %s", json.dumps(mask_attendee_payload(att)))

            # Check for cancellation/refund
            att_status = (att.get('status') or '').strip().title()
            attendee_id = att.get('id')

            if attendee_id and att_status in ['Refunded', 'Cancelled']:
                # Release the seat immediately
                EventSeat.objects.filter(event=event, eventbrite_attendee_id=attendee_id).update(
                    status='available',
                    eventbrite_attendee_id=None,
                    eventbrite_order_id=None,
                    attendee_name='',
                    attendee_email='',
                    ticket_class_id=None,
                    ticket_class_name='',
                    synced_at=timezone.now()
                )
                # Remove sync issues
                EventSeatSyncIssue.objects.filter(event=event, eventbrite_attendee_id=attendee_id).delete()
                continue

            # Check for valid ID
            normalized = normalize_eventbrite_attendee(att)
            attendee_id = normalized.get('eventbrite_attendee_id')

            if not attendee_id:
                # No attendee ID! Keep sync issue and avoid duplication
                order_id = normalized.get('eventbrite_order_id')
                email = normalized.get('attendee_email')
                name = normalized.get('attendee_name')
                exists = EventSeatSyncIssue.objects.filter(
                    event=event,
                    eventbrite_order_id=order_id,
                    attendee_email=email,
                    issue_type='missing_attendee_id'
                ).exists()
                if not exists:
                    EventSeatSyncIssue.objects.create(
                        event=event,
                        eventbrite_attendee_id=None,
                        eventbrite_order_id=order_id,
                        attendee_name=name,
                        attendee_email=email,
                        ticket_class_name=normalized.get('ticket_class_name', ''),
                        issue_type='missing_attendee_id'
                    )
                continue

            # Check if attendee is already assigned
            existing_seat = EventSeat.objects.filter(event=event, eventbrite_attendee_id=attendee_id).first()
            if existing_seat:
                # Idempotency: Keep allocation intact
                continue

            # Seat assignment logic
            has_clear_seat = bool(normalized.get('eventbrite_seat_id') or (normalized.get('row_label') and normalized.get('seat_label')))

            if has_clear_seat:
                seat = None
                if normalized.get('eventbrite_seat_id'):
                    seat = EventSeat.objects.filter(event=event, eventbrite_seat_id=normalized['eventbrite_seat_id']).first()
                if not seat and normalized.get('row_label') and normalized.get('seat_label'):
                    seat = EventSeat.objects.filter(
                        event=event,
                        section_label=normalized.get('section_label', ''),
                        row_label=normalized['row_label'],
                        seat_label=normalized['seat_label']
                    ).first()

                if seat:
                    seat.status = 'assigned'
                    seat.eventbrite_attendee_id = attendee_id
                    seat.eventbrite_order_id = normalized['eventbrite_order_id']
                    seat.attendee_name = normalized['attendee_name']
                    seat.attendee_email = normalized['attendee_email']
                    seat.ticket_class_id = normalized['ticket_class_id']
                    seat.ticket_class_name = normalized['ticket_class_name']
                    seat.synced_at = timezone.now()
                    seat.save()

                    # Clear sync issue
                    EventSeatSyncIssue.objects.filter(event=event, eventbrite_attendee_id=attendee_id).delete()
                else:
                    # Seat not found
                    EventSeatSyncIssue.objects.update_or_create(
                        event=event,
                        eventbrite_attendee_id=attendee_id,
                        defaults={
                            'eventbrite_order_id': normalized['eventbrite_order_id'],
                            'attendee_name': normalized['attendee_name'],
                            'attendee_email': normalized['attendee_email'],
                            'ticket_class_name': normalized['ticket_class_name'],
                            'issue_type': 'seat_not_found',
                        }
                    )
            else:
                # No clear seat details from Eventbrite
                if layout_mode == 'local_layout':
                    # Lock and find first available seat
                    free_seat = EventSeat.objects.select_for_update().filter(
                        event=event,
                        status='available'
                    ).order_by('row_label', 'seat_number', 'id').first()

                    if free_seat:
                        free_seat.status = 'assigned'
                        free_seat.eventbrite_attendee_id = attendee_id
                        free_seat.eventbrite_order_id = normalized['eventbrite_order_id']
                        free_seat.attendee_name = normalized['attendee_name']
                        free_seat.attendee_email = normalized['attendee_email']
                        free_seat.ticket_class_id = normalized['ticket_class_id']
                        free_seat.ticket_class_name = normalized['ticket_class_name']
                        free_seat.synced_at = timezone.now()
                        free_seat.save()

                        # Clear sync issue
                        EventSeatSyncIssue.objects.filter(event=event, eventbrite_attendee_id=attendee_id).delete()
                    else:
                        # Full local layout
                        EventSeatSyncIssue.objects.update_or_create(
                            event=event,
                            eventbrite_attendee_id=attendee_id,
                            defaults={
                                'eventbrite_order_id': normalized['eventbrite_order_id'],
                                'attendee_name': normalized['attendee_name'],
                                'attendee_email': normalized['attendee_email'],
                                'ticket_class_name': normalized['ticket_class_name'],
                                'issue_type': 'unassigned',
                            }
                        )
                else:
                    # Reserved Seating mode, but no seat returned by Eventbrite -> Do not invent seats!
                    EventSeatSyncIssue.objects.update_or_create(
                        event=event,
                        eventbrite_attendee_id=attendee_id,
                        defaults={
                            'eventbrite_order_id': normalized['eventbrite_order_id'],
                            'attendee_name': normalized['attendee_name'],
                            'attendee_email': normalized['attendee_email'],
                            'ticket_class_name': normalized['ticket_class_name'],
                            'issue_type': 'unassigned',
                        }
                    )

        return Response({'message': 'Sincronizacao de assentos concluida com sucesso.'})
