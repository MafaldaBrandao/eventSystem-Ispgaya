import os
import sys
from pathlib import Path
from unittest import TestCase
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import RequestFactory
from rest_framework.request import Request
from django.utils import timezone

from infocultura.view_modules.public_views import PublicNewsListView, PublicEventListView


class PublicPublishingScheduleTests(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @patch('infocultura.view_modules.public_views.News.objects.select_related')
    def test_public_news_list_filters_by_published_at(self, mock_select_related):
        # Arrange
        mock_filter = MagicMock()
        mock_select_related.return_value.filter.return_value = mock_filter
        mock_filter.filter.return_value = mock_filter
        mock_filter.order_by.return_value = []

        view = PublicNewsListView()
        django_request = self.factory.get('/api/news/')
        view.request = Request(django_request)

        # Act
        view.get_queryset()

        # Assert
        # The first filter call on News.objects should filter where published_at is not null and is in the past
        calls = mock_select_related.return_value.filter.call_args_list
        found_published_at_filter = False
        for call in calls:
            kwargs = call[1]
            if 'published_at__lte' in kwargs:
                found_published_at_filter = True
                # The value should be close to timezone.now()
                self.assertIsNotNone(kwargs['published_at__lte'])
                self.assertFalse(kwargs['published_at__isnull'])
        
        self.assertTrue(found_published_at_filter, "Should filter news by published_at <= current time")

    @patch('infocultura.view_modules.public_views.Event.objects.select_related')
    def test_public_event_list_filters_by_created_at(self, mock_select_related):
        # Arrange
        mock_prefetch = MagicMock()
        mock_select_related.return_value.prefetch_related.return_value = mock_prefetch
        mock_filter = MagicMock()
        mock_prefetch.filter.return_value = mock_filter
        mock_filter.filter.return_value = mock_filter
        mock_filter.order_by.return_value = []

        view = PublicEventListView()
        django_request = self.factory.get('/api/events/')
        view.request = Request(django_request)


        # Act
        view.get_queryset()

        # Assert
        # The filter chain on Event.objects should filter where created_at is null or in the past
        calls = mock_filter.filter.call_args_list
        found_created_at_filter = False
        for call in calls:
            args = call[0]
            if args and len(args) > 0:
                q_str = str(args[0])
                if 'created_at__isnull' in q_str and 'created_at__lte' in q_str:
                    found_created_at_filter = True
        
        self.assertTrue(found_created_at_filter, "Should filter events by created_at <= current time or null")
