from __future__ import annotations

from django.utils import timezone
from rest_framework import serializers

from ..models import Newsletter, NewsletterSubscriber

NEWSLETTER_STATUS_VALUES = {'draft', 'scheduled', 'sent', 'cancelled'}


class NewsletterSerializer(serializers.ModelSerializer):
    status = serializers.CharField()
    user_id = serializers.IntegerField(read_only=True, allow_null=True)
    user_name = serializers.CharField(source='user.name', read_only=True, allow_null=True)

    class Meta:
        model = Newsletter
        fields = [
            'id',
            'title',
            'subject',
            'content',
            'image',
            'status',
            'sent_at',
            'created_at',
            'user_id',
            'user_name',
        ]
        read_only_fields = ['id', 'sent_at', 'created_at', 'user_id', 'user_name']

    def validate_status(self, value: str) -> str:
        cleaned = (value or '').strip().lower()
        if cleaned not in NEWSLETTER_STATUS_VALUES:
            raise serializers.ValidationError('Estado de newsletter invalido.')
        return cleaned

    def validate_title(self, value: str) -> str:
        return value.strip()

    def validate_subject(self, value: str) -> str:
        return value.strip()

    def validate_content(self, value: str) -> str:
        return value.strip()

    def create(self, validated_data):
        request_user = self.context['request'].user
        validated_data['user'] = request_user
        if validated_data.get('status') == 'sent' and not validated_data.get('sent_at'):
            validated_data['sent_at'] = timezone.now()
        return Newsletter.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)

        if validated_data.get('status') == 'sent' and not instance.sent_at:
            instance.sent_at = timezone.now()

        instance.save()
        return instance


class NewsletterSubscriberSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()

    class Meta:
        model = NewsletterSubscriber
        fields = ['id', 'email', 'is_active', 'subscribed_at']
        read_only_fields = ['id', 'subscribed_at']
        extra_kwargs = {'email': {'validators': []}}

    def validate_email(self, value: str) -> str:
        cleaned = value.strip().lower()
        if not cleaned:
            raise serializers.ValidationError('Email invalido.')
        return cleaned

    def create(self, validated_data):
        validated_data['email'] = validated_data['email'].strip().lower()
        return NewsletterSubscriber.objects.create(**validated_data)

    def update(self, instance, validated_data):
        if 'email' in validated_data:
            validated_data['email'] = validated_data['email'].strip().lower()
        return super().update(instance, validated_data)
