from rest_framework import serializers

from ..core.security import validate_login_identifier


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(trim_whitespace=True, max_length=150)
    password = serializers.CharField(trim_whitespace=False, max_length=128)

    def validate_username(self, value):
        try:
            return validate_login_identifier(value)
        except ValueError as error:
            raise serializers.ValidationError(str(error)) from error

    def validate_password(self, value):
        if not value:
            raise serializers.ValidationError('A password e obrigatoria.')
        if any(ord(char) < 32 or ord(char) == 127 for char in value):
            raise serializers.ValidationError('A password contem caracteres invalidos.')
        return value
