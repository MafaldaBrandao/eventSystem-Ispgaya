from __future__ import annotations

from rest_framework import serializers

from ..models import Club
from ..core.security import validate_entity_name


class ClubScopedWriteMixin:
    club_id = serializers.PrimaryKeyRelatedField(
        source='club',
        queryset=Club.objects.all(),
        required=False,
    )

    def resolve_club_scope(self, attrs):
        request = self.context['request']
        user = request.user
        role_name = getattr(getattr(user, 'role', None), 'name', None)

        if role_name == 'club_admin':
            if not user.club_id:
                raise serializers.ValidationError(
                    {'club_id': 'O club_admin tem de ter um clube associado.'}
                )

            attrs['club'] = user.club

        club = attrs.get('club') or getattr(self.instance, 'club', None)
        if club is None:
            raise serializers.ValidationError({'club_id': 'O clube e obrigatorio.'})

        return club


class ContactRegistrationSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=100)
    email = serializers.EmailField(max_length=150)
    phone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    message = serializers.CharField(required=False, allow_blank=True)

    def validate_name(self, value):
        try:
            return validate_entity_name(value, field_label='O nome')
        except ValueError as error:
            raise serializers.ValidationError(str(error)) from error
