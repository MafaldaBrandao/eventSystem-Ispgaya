from django.core.exceptions import ValidationError as DjangoValidationError
from django.core.validators import validate_email as django_validate_email
from django.db import transaction
from rest_framework import serializers

from ..core.security import (
    generate_temporary_password,
    hash_password,
    normalize_email_address,
    validate_entity_name,
    validate_plaintext_password,
)
from ..models import AppUser, Club, Role
from ..service_modules.user_credentials import send_user_credentials_email


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.name', read_only=True)
    club_id = serializers.SerializerMethodField()
    club_name = serializers.SerializerMethodField()

    class Meta:
        model = AppUser
        fields = ['id', 'name', 'email', 'role', 'is_active', 'club_id', 'club_name', 'created_at']

    def get_club_id(self, obj):
        return obj.club_id

    def get_club_name(self, obj):
        return obj.club.name if obj.club else None


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ['id', 'name', 'description']


class AdminUserWriteSerializer(serializers.ModelSerializer):
    role = serializers.SlugRelatedField(slug_field='name', queryset=Role.objects.all())
    name = serializers.CharField(max_length=150)
    email = serializers.EmailField(max_length=150)
    club_id = serializers.PrimaryKeyRelatedField(
        source='club',
        queryset=Club.objects.all(),
        allow_null=True,
        required=False,
    )
    password = serializers.CharField(write_only=True, required=False, allow_blank=False)
    generate_password = serializers.BooleanField(write_only=True, required=False, default=False)
    generated_password = serializers.CharField(read_only=True, allow_null=True, required=False)
    credentials_sent = serializers.BooleanField(read_only=True, required=False)

    class Meta:
        model = AppUser
        fields = [
            'id',
            'name',
            'email',
            'role',
            'club_id',
            'is_active',
            'password',
            'generate_password',
            'generated_password',
            'credentials_sent',
        ]
        read_only_fields = ['id']
        extra_kwargs = {
            'is_active': {'required': False},
        }

    def validate_email(self, value):
        normalized_email = normalize_email_address(value)

        try:
            django_validate_email(normalized_email)
        except DjangoValidationError as error:
            raise serializers.ValidationError('Indica um email valido.') from error

        queryset = AppUser.objects.filter(email__iexact=normalized_email)
        if self.instance:
            queryset = queryset.exclude(pk=self.instance.pk)

        if queryset.exists():
            raise serializers.ValidationError('Ja existe um utilizador com este email.')

        return normalized_email

    def validate_name(self, value):
        try:
            return validate_entity_name(value, field_label='O nome do utilizador')
        except ValueError as error:
            raise serializers.ValidationError(str(error)) from error

    def validate_password(self, value):
        try:
            return validate_plaintext_password(value, min_length=8)
        except ValueError as error:
            raise serializers.ValidationError(str(error)) from error

    def create(self, validated_data):
        raw_password = validated_data.pop('password', None)
        generate_password = bool(validated_data.pop('generate_password', False))
        generated_password = None

        if generate_password or not raw_password:
            generated_password = generate_temporary_password()
            raw_password = generated_password

        with transaction.atomic():
            validated_data['password_hash'] = hash_password(raw_password)
            validated_data.setdefault('is_active', True)
            user = AppUser.objects.create(**validated_data)
            send_user_credentials_email(
                recipient_email=user.email,
                recipient_name=user.name,
                password=raw_password,
            )

        user.generated_password = generated_password
        user.credentials_sent = True
        return user

    def update(self, instance, validated_data):
        raw_password = validated_data.pop('password', None)
        generate_password = bool(validated_data.pop('generate_password', False))
        generated_password = None

        for field, value in validated_data.items():
            setattr(instance, field, value)

        if generate_password or raw_password:
            if generate_password or not raw_password:
                generated_password = generate_temporary_password()
                raw_password = generated_password
            instance.password_hash = hash_password(raw_password)

        with transaction.atomic():
            instance.save()
            if raw_password:
                send_user_credentials_email(
                    recipient_email=instance.email,
                    recipient_name=instance.name,
                    password=raw_password,
                )

        instance.generated_password = generated_password
        instance.credentials_sent = bool(raw_password)
        return instance

    def to_representation(self, instance):
        payload = UserSerializer(instance).data
        payload['generated_password'] = getattr(instance, 'generated_password', None)
        payload['credentials_sent'] = bool(getattr(instance, 'credentials_sent', False))
        return payload
