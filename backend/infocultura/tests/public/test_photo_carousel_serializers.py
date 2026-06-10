import os
import sys
from pathlib import Path
from unittest import TestCase

sys.path.insert(0, str(Path(__file__).resolve().parents[3]))

import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from infocultura.api.serializers_content import PhotoCarouselItemSerializer


class PhotoCarouselItemSerializerTests(TestCase):
    def test_serializer_with_valid_data(self):
        data = {
            'section': 'laboratorio-cultural',
            'title': 'Foto do Carrossel',
            'caption': 'Legenda da foto',
            'image': 'photos/carrossel1.jpg',
            'alt_text': 'Alt text descritivo',
            'display_order': 3,
            'is_active': True,
        }
        serializer = PhotoCarouselItemSerializer(data=data)
        self.assertTrue(serializer.is_valid(), serializer.errors)
        
        # Verify validated data values
        self.assertEqual(serializer.validated_data['section'], 'laboratorio-cultural')
        self.assertEqual(serializer.validated_data['title'], 'Foto do Carrossel')
        self.assertEqual(serializer.validated_data['image'], 'photos/carrossel1.jpg')
        self.assertEqual(serializer.validated_data['display_order'], 3)
        self.assertTrue(serializer.validated_data['is_active'])

    def test_serializer_rejects_missing_image(self):
        data = {
            'section': 'laboratorio-cultural',
            'title': 'Foto sem imagem',
            'caption': 'Legenda',
            'display_order': 1,
        }
        serializer = PhotoCarouselItemSerializer(data=data)
        self.assertFalse(serializer.is_valid())
        self.assertIn('image', serializer.errors)
