from rest_framework import serializers

from ..models import CulturalContent, PhotoCarouselItem


class CulturalContentSerializer(serializers.ModelSerializer):
    updatedAt = serializers.DateTimeField(source='updated_at', read_only=True)

    class Meta:
        model = CulturalContent
        fields = ['id', 'area', 'title', 'description', 'date', 'status', 'updatedAt']


class PhotoCarouselItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PhotoCarouselItem
        fields = [
            'id',
            'section',
            'title',
            'caption',
            'image',
            'alt_text',
            'display_order',
            'is_active',
            'created_at',
            'updated_at',
        ]
