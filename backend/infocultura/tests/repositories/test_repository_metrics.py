import os
import sys
from datetime import timedelta
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from types import SimpleNamespace

from django.test import TestCase
from django.utils import timezone

from infocultura.models import MetricView
from infocultura.repositories.metrics import get_admin_metrics_overview


class MetricsRepositoryTests(TestCase):
    def test_admin_metrics_overview_groups_views_by_period(self):
        now = timezone.now()
        MetricView.objects.create(
            section='news',
            content_type='news',
            title='Notícia A',
            page_path='/vida-academica/noticias/1',
            visitor_key='visitor-a',
            viewed_at=now,
        )
        MetricView.objects.create(
            section='events',
            content_type='event',
            title='Evento B',
            page_path='/vida-academica/eventos/2',
            visitor_key='visitor-b',
            viewed_at=now - timedelta(days=1),
        )

        with (
            patch('infocultura.repositories.metrics.Club.objects.filter') as club_filter,
            patch('infocultura.repositories.metrics.News.objects.filter') as news_filter,
        ):
            club_filter.return_value.count.return_value = 3
            news_filter.return_value.count.return_value = 4
            overview = get_admin_metrics_overview(user=SimpleNamespace(), period='day', limit=5)

        self.assertEqual(overview.total_views, 2)
        self.assertEqual(overview.unique_pages, 2)
        self.assertEqual(overview.unique_visitors, 2)
        self.assertEqual(overview.clubs_created, 3)
        self.assertEqual(overview.news_created, 4)
        self.assertEqual(overview.top_pages[0].title, 'Notícia A')
        self.assertEqual(overview.top_pages[0].views, 1)
        self.assertGreaterEqual(len(overview.series), 1)
        self.assertTrue(any(point.value == 1 for point in overview.series))
