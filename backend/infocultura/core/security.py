from datetime import datetime, timedelta, timezone
import secrets
import string
from uuid import uuid4

import jwt
from django.conf import settings
from django.core.cache import cache
from django.contrib.auth.hashers import check_password, make_password


def _has_control_characters(value: str) -> bool:
    return any(ord(char) < 32 or ord(char) == 127 for char in value)


def normalize_email_address(value: str) -> str:
    return value.strip().lower()


def normalize_login_identifier(value: str) -> str:
    return value.strip()


def validate_login_identifier(value: str) -> str:
    normalized = normalize_login_identifier(value)
    if not normalized:
        raise ValueError("O utilizador ou email e obrigatorio.")
    if _has_control_characters(normalized):
        raise ValueError("O utilizador contem caracteres invalidos.")
    return normalized


def _validate_name_characters(value: str, *, field_label: str) -> str:
    allowed_punctuation = {" ", "-", "'", "."}
    if not any(char.isalpha() for char in value):
        raise ValueError(f"{field_label} tem de conter pelo menos uma letra.")

    invalid_characters = [char for char in value if not (char.isalpha() or char in allowed_punctuation)]
    if invalid_characters:
        raise ValueError(
            f"{field_label} apenas pode conter letras, espacos, hifens, apostrofos e pontos."
        )

    return value


def validate_person_name(value: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError("O nome e obrigatorio.")
    if _has_control_characters(normalized):
        raise ValueError("O nome contem caracteres invalidos.")
    return _validate_name_characters(normalized, field_label="O nome")


def validate_entity_name(value: str, *, field_label: str) -> str:
    normalized = value.strip()
    if not normalized:
        raise ValueError(f"{field_label} e obrigatorio.")
    if _has_control_characters(normalized):
        raise ValueError(f"{field_label} contem caracteres invalidos.")
    return _validate_name_characters(normalized, field_label=field_label)


def validate_plaintext_password(value: str, *, min_length: int = 8) -> str:
    if value is None:
        raise ValueError("A password e obrigatoria.")

    if _has_control_characters(value):
        raise ValueError("A password contem caracteres invalidos.")

    if len(value) < min_length:
        raise ValueError(f"A password deve ter pelo menos {min_length} caracteres.")

    if len(value) > 128:
        raise ValueError("A password nao pode exceder 128 caracteres.")

    return value


def hash_password(raw_password: str) -> str:
    return make_password(raw_password)


def generate_temporary_password(length: int = 12) -> str:
    if length < 8:
        raise ValueError("A password temporaria deve ter pelo menos 8 caracteres.")

    alphabet = string.ascii_letters + string.digits + "!@#$%&*+-_"
    while True:
        candidate = ''.join(secrets.choice(alphabet) for _ in range(length))
        if (
            any(char.islower() for char in candidate)
            and any(char.isupper() for char in candidate)
            and any(char.isdigit() for char in candidate)
        ):
            return candidate


def check_password_hash(raw_password: str, stored_hash: str) -> bool:
    if not stored_hash:
        return False

    # Accept Django hashes and keep a dev fallback for plain text.
    try:
        if check_password(raw_password, stored_hash):
            return True
    except Exception:
        pass

    return raw_password == stored_hash


def issue_access_token(user_id: int, role_name: str, email: str, name: str) -> str:
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(minutes=getattr(settings, 'INFOCULTURA_ACCESS_TOKEN_MINUTES', 30))

    payload = {
        'sub': str(user_id),
        'type': 'access',
        'role': role_name,
        'email': email,
        'name': name,
        'jti': uuid4().hex,
        'iat': int(now.timestamp()),
        'exp': int(exp.timestamp()),
    }

    return jwt.encode(payload, settings.INFOCULTURA_JWT_SECRET, algorithm='HS256')


def issue_refresh_token(user_id: int, role_name: str, email: str, name: str) -> str:
    now = datetime.now(tz=timezone.utc)
    exp = now + timedelta(days=getattr(settings, 'INFOCULTURA_REFRESH_TOKEN_DAYS', 7))

    payload = {
        'sub': str(user_id),
        'type': 'refresh',
        'role': role_name,
        'email': email,
        'name': name,
        'jti': uuid4().hex,
        'iat': int(now.timestamp()),
        'exp': int(exp.timestamp()),
    }

    return jwt.encode(payload, settings.INFOCULTURA_JWT_SECRET, algorithm='HS256')


def issue_token_pair(user_id: int, role_name: str, email: str, name: str) -> tuple[str, str]:
    return (
        issue_access_token(user_id=user_id, role_name=role_name, email=email, name=name),
        issue_refresh_token(user_id=user_id, role_name=role_name, email=email, name=name),
    )


def decode_access_token(token: str) -> dict:
    payload = jwt.decode(token, settings.INFOCULTURA_JWT_SECRET, algorithms=['HS256'])
    if payload.get('type') not in {None, 'access'}:
        raise jwt.InvalidTokenError('Token type invalido.')
    return payload


def decode_refresh_token(token: str) -> dict:
    payload = jwt.decode(token, settings.INFOCULTURA_JWT_SECRET, algorithms=['HS256'])
    if payload.get('type') != 'refresh':
        raise jwt.InvalidTokenError('Refresh token invalido.')
    return payload


def revoke_refresh_token(payload: dict) -> None:
    jti = payload.get('jti')
    exp = payload.get('exp')
    if not jti or not exp:
        return

    now_ts = int(datetime.now(tz=timezone.utc).timestamp())
    timeout = max(1, int(exp) - now_ts)
    cache.set(f'infocultura:refresh:revoked:{jti}', True, timeout=timeout)


def is_refresh_token_revoked(payload: dict) -> bool:
    jti = payload.get('jti')
    if not jti:
        return True

    return bool(cache.get(f'infocultura:refresh:revoked:{jti}'))
