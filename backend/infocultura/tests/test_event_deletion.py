import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from infocultura.view_modules.admin.events import AdminEventDetailView, AdminEventBulkDeleteView
from rest_framework.test import APIRequestFactory
from rest_framework.request import Request
from types import SimpleNamespace


class EventDeletionViewTests(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()

    @patch('infocultura.view_modules.admin.events.EventCategory.objects.filter')
    @patch('infocultura.view_modules.admin.events.EventRegistration.objects.filter')
    @patch('infocultura.view_modules.admin.events.generics.RetrieveUpdateDestroyAPIView.destroy')
    @patch('infocultura.view_modules.admin.events.AdminEventDetailView.get_object')
    @patch('infocultura.view_modules.admin.events.AdminEventDetailView.write_audit_entry')
    def test_admin_event_detail_view_destroy_deletes_relations_first(
        self, write_audit_mock, get_object_mock, super_destroy_mock, reg_filter_mock, cat_filter_mock
    ):
        # Arrange
        event_instance = SimpleNamespace(id=7)
        get_object_mock.return_value = event_instance
        
        cat_query_mock = MagicMock()
        cat_filter_mock.return_value = cat_query_mock
        
        reg_query_mock = MagicMock()
        reg_filter_mock.return_value = reg_query_mock

        view = AdminEventDetailView()
        view.request = self.factory.delete('/api/events/admin/7/')

        # Act
        view.destroy(view.request)

        # Assert
        cat_filter_mock.assert_called_once_with(event=event_instance)
        cat_query_mock.delete.assert_called_once()
        
        reg_filter_mock.assert_called_once_with(event=event_instance)
        reg_query_mock.delete.assert_called_once()

        self.assertEqual(write_audit_mock.call_count, 2)
        write_audit_mock.assert_any_call(view.request, action='delete', instance=event_instance)
        super_destroy_mock.assert_called_once()

    @patch('infocultura.view_modules.admin.events.Event.objects.filter')
    @patch('infocultura.view_modules.admin.events.EventCategory.objects.filter')
    @patch('infocultura.view_modules.admin.events.EventRegistration.objects.filter')
    @patch('infocultura.view_modules.admin.events.record_admin_audit_action')
    def test_admin_event_bulk_delete_view_deletes_relations_first(
        self, audit_mock, reg_filter_mock, cat_filter_mock, event_filter_mock
    ):
        # Arrange
        request_user = SimpleNamespace(id=1, role=SimpleNamespace(name='superadmin'), club_id=None)
        
        event_query_mock = MagicMock()
        event_query_mock.values_list.return_value = [7, 8]
        event_filter_mock.return_value = event_query_mock
        
        cat_query_mock = MagicMock()
        cat_filter_mock.return_value = cat_query_mock
        
        reg_query_mock = MagicMock()
        reg_filter_mock.return_value = reg_query_mock

        view = AdminEventBulkDeleteView()
        django_request = self.factory.post('/api/events/admin/bulk-delete/', data={'ids': [7, 8]}, format='json')
        django_request.user = request_user
        drf_request = Request(django_request, parsers=view.get_parsers())
        drf_request._user = request_user



        # Act
        response = view.post(drf_request)

        # Assert
        event_filter_mock.assert_called_once_with(id__in=[7, 8])
        cat_filter_mock.assert_called_once_with(event__in=event_query_mock)
        cat_query_mock.delete.assert_called_once()
        
        reg_filter_mock.assert_called_once_with(event__in=event_query_mock)
        reg_query_mock.delete.assert_called_once()

        event_query_mock.delete.assert_called_once()
        audit_mock.assert_called_once_with(
            action='bulk_delete',
            content_type='event',
            summary='2 eventos removidos',
            actor_user=request_user,
            metadata={'ids': [7, 8]},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, {'deleted': 2})
