import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from unittest import TestCase
from unittest.mock import patch, MagicMock
from rest_framework.test import APIRequestFactory

from infocultura.models import Event, VenueLayout, EventSeat, EventSeatSyncIssue
from infocultura.view_modules.admin.views_seating import (
    AdminEventSeatingView,
    AdminEventSeatingPaintView,
    AdminEventSeatingSyncView,
)


class SeatingTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        self.admin_user = SimpleNamespaceMock(id=1, role_name='superadmin', club_id=None)
        
        # Using a MagicMock for the event mock
        self.event_mock = MagicMock()
        self.event_mock.id = 10
        self.event_mock.eventbrite_event_id = "eb_event_123"

    @patch('infocultura.view_modules.admin.views_seating.Event.objects.all')
    @patch('infocultura.view_modules.admin.views_seating.EventSeat.objects.filter')
    @patch('infocultura.view_modules.admin.views_seating.EventSeatSyncIssue.objects.filter')
    def test_get_seating_empty(self, issue_filter_mock, seat_filter_mock, event_all_mock):
        # Setup event mock
        event_all_mock.return_value = event_all_mock
        event_all_mock.get.return_value = self.event_mock

        # Setup venue_layout to raise VenueLayout.DoesNotExist
        type(self.event_mock).venue_layout = property(
            lambda s: (_ for _ in ()).throw(VenueLayout.DoesNotExist("VenueLayout matching query does not exist."))
        )

        # Empty seats and issues querysets
        seat_filter_mock.return_value = seat_filter_mock
        seat_filter_mock.order_by.return_value = []

        issue_filter_mock.return_value = issue_filter_mock
        issue_filter_mock.order_by.return_value = []

        view = AdminEventSeatingView()
        request = self.factory.get('/api/events/admin/10/seating/')
        request.user = self.admin_user

        response = view.dispatch(request, event_id=10)
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.data['venue_layout'])
        self.assertEqual(len(response.data['seats']), 0)
        self.assertEqual(len(response.data['sync_issues']), 0)

    @patch('infocultura.view_modules.admin.views_seating.Event.objects.all')
    @patch('infocultura.view_modules.admin.views_seating.VenueLayout.objects.get_or_create')
    @patch('infocultura.view_modules.admin.views_seating.EventSeat.objects.get_or_create')
    @patch('infocultura.view_modules.admin.views_seating.EventSeat.objects.filter')
    @patch('infocultura.view_modules.admin.views_seating.EventSeatSyncIssue.objects.filter')
    def test_post_layout_local(self, issue_filter_mock, seat_filter_mock, seat_get_or_create_mock, layout_get_or_create_mock, event_all_mock):
        # Setup event mock
        event_all_mock.return_value = event_all_mock
        event_all_mock.get.return_value = self.event_mock

        # Setup layout mock
        layout_mock = MagicMock()
        layout_mock.id = 1
        layout_mock.layout_mode = 'local_layout'
        layout_mock.rows = 2
        layout_mock.seats_per_row = 5
        layout_mock.row_prefix = 'Fila'
        layout_mock.eventbrite_seat_map_id = None
        layout_mock.notes = 'Test notes'
        
        self.event_mock.venue_layout = layout_mock
        layout_get_or_create_mock.return_value = (layout_mock, True)

        # Empty existing seats
        existing_seats_mock = MagicMock()
        existing_seats_mock.__iter__.return_value = iter([])
        seat_filter_mock.return_value = existing_seats_mock
        seat_filter_mock.order_by.return_value = []

        issue_filter_mock.return_value = issue_filter_mock
        issue_filter_mock.order_by.return_value = []

        view = AdminEventSeatingView()
        data = {
            'layout_mode': 'local_layout',
            'rows': 2,
            'seats_per_row': 5,
            'row_prefix': 'Fila',
            'notes': 'Test notes'
        }
        request = self.factory.post('/api/events/admin/10/seating/', data=data, format='json')
        request.user = self.admin_user

        response = view.dispatch(request, event_id=10)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['venue_layout']['layout_mode'], 'local_layout')
        self.assertEqual(response.data['venue_layout']['rows'], 2)
        self.assertEqual(response.data['venue_layout']['seats_per_row'], 5)

        # Verify that get_or_create was called to generate the seats (10 times)
        self.assertEqual(seat_get_or_create_mock.call_count, 10)

    @patch('infocultura.view_modules.admin.views_seating.Event.objects.all')
    @patch('infocultura.view_modules.admin.views_seating.EventSeat.objects.select_for_update')
    def test_paint_seat(self, select_for_update_mock, event_all_mock):
        event_all_mock.return_value = event_all_mock
        event_all_mock.get.return_value = self.event_mock

        # Case 1: Paint available to blocked
        seat_mock_1 = MagicMock()
        seat_mock_1.status = 'available'
        seat_mock_1.eventbrite_attendee_id = None
        
        select_for_update_mock.return_value = select_for_update_mock
        select_for_update_mock.get.return_value = seat_mock_1

        view = AdminEventSeatingPaintView()
        request = self.factory.post('/api/events/admin/10/seating/paint/', data={'seat_id': 123, 'status': 'blocked'}, format='json')
        request.user = self.admin_user

        response = view.dispatch(request, event_id=10)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(seat_mock_1.status, 'blocked')
        seat_mock_1.save.assert_called_once()

        # Case 2: Paint available to held (should map to assigned)
        seat_mock_2 = MagicMock()
        seat_mock_2.status = 'available'
        seat_mock_2.eventbrite_attendee_id = None
        select_for_update_mock.get.return_value = seat_mock_2

        request = self.factory.post('/api/events/admin/10/seating/paint/', data={'seat_id': 124, 'status': 'held'}, format='json')
        request.user = self.admin_user

        response = view.dispatch(request, event_id=10)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(seat_mock_2.status, 'assigned')
        seat_mock_2.save.assert_called_once()

        # Case 3: Revert manually assigned seat (eventbrite_attendee_id = None) to available
        seat_mock_3 = MagicMock()
        seat_mock_3.status = 'assigned'
        seat_mock_3.eventbrite_attendee_id = None
        select_for_update_mock.get.return_value = seat_mock_3

        request = self.factory.post('/api/events/admin/10/seating/paint/', data={'seat_id': 125, 'status': 'available'}, format='json')
        request.user = self.admin_user

        response = view.dispatch(request, event_id=10)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(seat_mock_3.status, 'available')
        self.assertIsNone(seat_mock_3.eventbrite_attendee_id)
        seat_mock_3.save.assert_called_once()

        # Case 4: Cannot change seat assigned to actual Eventbrite attendee
        seat_mock_4 = MagicMock()
        seat_mock_4.status = 'assigned'
        seat_mock_4.eventbrite_attendee_id = 'eb_att_123'
        select_for_update_mock.get.return_value = seat_mock_4

        request = self.factory.post('/api/events/admin/10/seating/paint/', data={'seat_id': 126, 'status': 'available'}, format='json')
        request.user = self.admin_user

        response = view.dispatch(request, event_id=10)
        self.assertEqual(response.status_code, 400)
        self.assertIn("Nao e possivel alterar o estado de um lugar atribuido", response.data['message'])

    @patch('infocultura.view_modules.admin.views_seating.Event.objects.all')
    @patch('infocultura.view_modules.admin.views_seating.list_eventbrite_attendees')
    @patch('infocultura.view_modules.admin.views_seating.get_eventbrite_seat_map')
    @patch('infocultura.view_modules.admin.views_seating.EventSeat.objects.filter')
    @patch('infocultura.view_modules.admin.views_seating.EventSeat.objects.create')
    @patch('infocultura.view_modules.admin.views_seating.EventSeatSyncIssue.objects.filter')
    def test_sync_seats_reserved_seating(self, issue_filter_mock, seat_create_mock, seat_filter_mock, mock_seat_map, mock_attendees, event_all_mock):
        event_all_mock.return_value = event_all_mock
        event_all_mock.get.return_value = self.event_mock

        # Layout mock
        layout_mock = MagicMock()
        layout_mock.layout_mode = 'eventbrite_reserved_seating'
        self.event_mock.venue_layout = layout_mock

        # Eventbrite Mocks
        mock_seat_map.return_value = [
            {'id': 'eb_seat_A1', 'section': 'Main', 'row': 'A', 'seat': '1'},
        ]
        mock_attendees.return_value = {
            'attendees': [
                {
                    'id': 'eb_att_1',
                    'order_id': 'eb_ord_1',
                    'status': 'Attending',
                    'profile': {'name': 'John Doe', 'email': 'john@example.com'},
                    'seat': {'seat_id': 'eb_seat_A1', 'section': 'Main', 'row': 'A', 'seat': '1'}
                }
            ],
            'pagination': {'has_more_items': False}
        }

        # Seat filter mock
        seat_obj_mock = MagicMock()
        seat_obj_mock.status = 'available'
        seat_obj_mock.eventbrite_seat_id = 'eb_seat_A1'
        
        # When looking up seats:
        # 1. Sync seat map check seat ID: None
        # 2. Sync seat map check seat labels: None -> triggers creation of seat A1
        # 3. Attendee sync check existing attendee seat: None
        # 4. Attendee sync check attendee seat by ID: seat_obj_mock
        seat_filter_mock.return_value = seat_filter_mock
        seat_filter_mock.first.side_effect = [None, None, None, seat_obj_mock]

        view = AdminEventSeatingSyncView()
        request = self.factory.post('/api/events/admin/10/seating/sync/', format='json')
        request.user = self.admin_user

        response = view.dispatch(request, event_id=10)
        self.assertEqual(response.status_code, 200)

        # Assert seat was updated to assigned
        self.assertEqual(seat_obj_mock.status, 'assigned')
        self.assertEqual(seat_obj_mock.attendee_name, 'John Doe')
        seat_obj_mock.save.assert_called_once()


class SimpleNamespaceMock:
    def __init__(self, **kwargs):
        self.is_active = True
        self.is_authenticated = True
        for k, v in kwargs.items():
            setattr(self, k, v)
            
    @property
    def role(self):
        role_mock = MagicMock()
        role_mock.name = getattr(self, 'role_name', 'superadmin')
        return role_mock
