from rest_framework import serializers

from ..models import AppUser, Club
from ..core.security import validate_entity_name


class ClubSerializer(serializers.ModelSerializer):
    image = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Club
        fields = [
            'id',
            'name',
            'description',
            'mission',
            'image',
            'is_active',
            'enable_registrations',
            'created_at',
        ]

    def validate_name(self, value):
        try:
            return validate_entity_name(value, field_label='O nome do clube')
        except ValueError as error:
            raise serializers.ValidationError(str(error)) from error

    def create(self, validated_data):
        return Club.objects.create(**validated_data)

    def update(self, instance, validated_data):
        for field, value in validated_data.items():
            setattr(instance, field, value)
        instance.save()
        return instance


class ClubMemberAssignSerializer(serializers.Serializer):
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=AppUser.objects.select_related('role', 'club').all(),
        source='user',
    )

    def validate_user(self, user):
        if not user.is_active:
            raise serializers.ValidationError('O utilizador tem de estar ativo.')

        if user.club_id:
            raise serializers.ValidationError('O utilizador ja pertence a um clube.')

        return user
