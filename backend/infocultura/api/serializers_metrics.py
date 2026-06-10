from __future__ import annotations

from rest_framework import serializers


class MetricViewCreateSerializer(serializers.Serializer):
    kind = serializers.CharField(required=False, default='page_view')
    section = serializers.CharField()
    content_type = serializers.CharField(required=False, allow_blank=True, default='')
    object_id = serializers.IntegerField(required=False, allow_null=True)
    title = serializers.CharField()
    page_path = serializers.CharField()
    locale = serializers.CharField(required=False, allow_blank=True, default='')
    referrer = serializers.CharField(required=False, allow_blank=True, default='')
    user_agent = serializers.CharField(required=False, allow_blank=True, default='')
    visitor_key = serializers.CharField(required=False, allow_blank=True, default='')
    club_id = serializers.IntegerField(required=False, allow_null=True)

    def validate_kind(self, value: str) -> str:
        cleaned = (value or '').strip().lower() or 'page_view'
        if cleaned != 'page_view':
            raise serializers.ValidationError('Tipo de metricas invalido.')
        return cleaned

    def validate_section(self, value: str) -> str:
        cleaned = value.strip().lower()
        if not cleaned:
            raise serializers.ValidationError('Secao invalida.')
        return cleaned

    def validate_title(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Titulo invalido.')
        return cleaned

    def validate_page_path(self, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise serializers.ValidationError('Caminho invalido.')
        return cleaned[:255]

    def validate_locale(self, value: str) -> str:
        return value.strip().lower()[:8]

    def validate_referrer(self, value: str) -> str:
        return value.strip()[:500]

    def validate_user_agent(self, value: str) -> str:
        return value.strip()[:255]

    def validate_visitor_key(self, value: str) -> str:
        return value.strip()[:64]
