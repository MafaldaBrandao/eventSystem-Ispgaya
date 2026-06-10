from rest_framework import serializers

from ..models import RegistrationStatus


class AdminNotificationSerializer(serializers.Serializer):
    id = serializers.CharField()
    kind = serializers.CharField()
    level = serializers.CharField()
    title = serializers.CharField()
    message = serializers.CharField()
    href = serializers.CharField()
    created_at = serializers.DateTimeField(allow_null=True)


class AdminAuditLogSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    action = serializers.CharField()
    content_type = serializers.CharField()
    object_id = serializers.IntegerField(allow_null=True)
    summary = serializers.CharField()
    actor_user_id = serializers.IntegerField(allow_null=True)
    actor_name = serializers.CharField()
    club_id = serializers.IntegerField(allow_null=True)
    metadata_json = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField(allow_null=True)


class AdminActivityLogSerializer(serializers.Serializer):
    source = serializers.CharField()
    action = serializers.CharField()
    content_type = serializers.CharField()
    object_id = serializers.IntegerField(allow_null=True)
    summary = serializers.CharField()
    actor_user_id = serializers.IntegerField(allow_null=True)
    actor_name = serializers.CharField()
    club_id = serializers.IntegerField(allow_null=True)
    metadata_json = serializers.CharField(allow_null=True)
    created_at = serializers.DateTimeField(allow_null=True)


class AdminBulkStatusUpdateSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )
    status = serializers.CharField(max_length=50)

    def validate_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        if not unique_ids:
            raise serializers.ValidationError('Seleciona pelo menos um registo.')
        return unique_ids


class AdminBulkIdsSerializer(serializers.Serializer):
    ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )

    def validate_ids(self, value):
        unique_ids = list(dict.fromkeys(value))
        if not unique_ids:
            raise serializers.ValidationError('Seleciona pelo menos um registo.')
        return unique_ids


class AdminClubRegistrationSerializer(serializers.Serializer):
    registration_id = serializers.IntegerField()
    club_id = serializers.IntegerField(allow_null=True)
    club_name = serializers.CharField()
    registration_type = serializers.CharField(required=False)
    target_title = serializers.CharField(required=False)
    name = serializers.CharField()
    email = serializers.EmailField()
    phone = serializers.CharField(allow_null=True)
    message = serializers.CharField(allow_null=True)
    status = serializers.CharField()
    created_at = serializers.DateTimeField(allow_null=True)


class AdminRegistrationStatusUpdateSerializer(serializers.Serializer):
    registration_status = serializers.SlugRelatedField(
        slug_field='name',
        queryset=RegistrationStatus.objects.all(),
        required=False,
    )

    def to_internal_value(self, data):
        if isinstance(data, dict) and 'registration_status' not in data and 'status' in data:
            data = {**data, 'registration_status': data.get('status')}
        return super().to_internal_value(data)

    def validate(self, attrs):
        if 'registration_status' not in attrs:
            raise serializers.ValidationError({'status': 'Este campo é obrigatório.'})
        return attrs
