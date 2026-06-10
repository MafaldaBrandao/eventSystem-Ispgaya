import os
import sys
from pathlib import Path
from unittest import TestCase

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from infocultura.api.serializers_metrics import MetricViewCreateSerializer


class MetricsSerializerTests(TestCase):
    def test_metric_view_serializer_normalizes_payload(self):
        serializer = MetricViewCreateSerializer(
            data={
                'section': '  news  ',
                'title': '  Notícias ',
                'page_path': ' /vida-academica/noticias ',
                'locale': ' PT ',
                'visitor_key': '  abc-123  ',
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data['kind'], 'page_view')
        self.assertEqual(serializer.validated_data['section'], 'news')
        self.assertEqual(serializer.validated_data['title'], 'Notícias')
        self.assertEqual(serializer.validated_data['page_path'], '/vida-academica/noticias')
        self.assertEqual(serializer.validated_data['locale'], 'pt')
        self.assertEqual(serializer.validated_data['visitor_key'], 'abc-123')
