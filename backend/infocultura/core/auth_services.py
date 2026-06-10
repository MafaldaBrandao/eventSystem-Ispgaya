from __future__ import annotations

import hashlib
from dataclasses import dataclass
from typing import Any

from django.conf import settings
from django.core.cache import cache
from rest_framework.response import Response


@dataclass(frozen=True, slots=True)
class LoginRateLimitConfig:
    max_attempts: int
    window_seconds: int
    lockout_seconds: int

    @classmethod
    def from_settings(cls) -> "LoginRateLimitConfig":
        return cls(
            max_attempts=max(1, int(getattr(settings, "INFOCULTURA_LOGIN_MAX_ATTEMPTS", 5))),
            window_seconds=max(60, int(getattr(settings, "INFOCULTURA_LOGIN_WINDOW_SECONDS", 900))),
            lockout_seconds=max(60, int(getattr(settings, "INFOCULTURA_LOGIN_LOCKOUT_SECONDS", 900))),
        )

    @property
    def lockout_message(self) -> str:
        minutes = max(1, self.lockout_seconds // 60)
        if minutes == 1:
            return "Login temporariamente bloqueado. Tenta novamente dentro de 1 minuto."
        return f"Login temporariamente bloqueado. Tenta novamente dentro de {minutes} minutos."


@dataclass(frozen=True, slots=True)
class LoginIdentity:
    client_ip: str
    identifier: str

    @property
    def normalized_identifier(self) -> str:
        return self.identifier.lower()


class LoginRateLimiter:
    def __init__(self, config: LoginRateLimitConfig | None = None) -> None:
        self.config = config or LoginRateLimitConfig.from_settings()

    def is_locked(self, identity: LoginIdentity) -> bool:
        return bool(cache.get(self._cache_key(identity=identity, prefix="lock")))

    def clear_failures(self, identity: LoginIdentity) -> None:
        cache.delete_many(
            [
                self._cache_key(identity=identity, prefix="fail"),
                self._cache_key(identity=identity, prefix="lock"),
            ]
        )

    def record_failure(self, identity: LoginIdentity) -> bool:
        fail_key = self._cache_key(identity=identity, prefix="fail")
        lock_key = self._cache_key(identity=identity, prefix="lock")

        added = cache.add(fail_key, 1, timeout=self.config.window_seconds)
        if added:
            attempts = 1
        else:
            attempts = cache.get(fail_key, 0)
            try:
                attempts = cache.incr(fail_key)
            except ValueError:
                attempts = int(attempts) + 1
                cache.set(fail_key, attempts, timeout=self.config.window_seconds)

        if int(attempts) >= self.config.max_attempts:
            cache.set(lock_key, True, timeout=self.config.lockout_seconds)
            cache.delete(fail_key)
            return True

        return False

    def _cache_key(self, *, identity: LoginIdentity, prefix: str) -> str:
        identifier_hash = hashlib.sha256(
            identity.normalized_identifier.encode("utf-8")
        ).hexdigest()
        return f"infocultura:login:{prefix}:{identity.client_ip}:{identifier_hash}"


class AuthCookieManager:
    access_cookie_name = "infocultura_access"
    refresh_cookie_name = "infocultura_refresh"

    @classmethod
    def configured_access_cookie_name(cls) -> str:
        return getattr(settings, "INFOCULTURA_ACCESS_COOKIE_NAME", cls.access_cookie_name)

    @classmethod
    def configured_refresh_cookie_name(cls) -> str:
        return getattr(settings, "INFOCULTURA_REFRESH_COOKIE_NAME", cls.refresh_cookie_name)

    def attach(self, response: Response, *, access_token: str, refresh_token: str) -> None:
        cookie_settings = self._cookie_settings()
        response.set_cookie(
            self.configured_access_cookie_name(),
            access_token,
            max_age=max(60, int(getattr(settings, "INFOCULTURA_ACCESS_TOKEN_MINUTES", 30)) * 60),
            **cookie_settings,
        )
        response.set_cookie(
            self.configured_refresh_cookie_name(),
            refresh_token,
            max_age=max(3600, int(getattr(settings, "INFOCULTURA_REFRESH_TOKEN_DAYS", 7)) * 24 * 60 * 60),
            **cookie_settings,
        )

    def clear(self, response: Response) -> None:
        cookie_settings = self._cookie_settings()
        response.delete_cookie(
            self.configured_access_cookie_name(),
            path="/",
            samesite=cookie_settings["samesite"],
        )
        response.delete_cookie(
            self.configured_refresh_cookie_name(),
            path="/",
            samesite=cookie_settings["samesite"],
        )

    def _cookie_settings(self) -> dict[str, Any]:
        return {
            "httponly": True,
            "secure": bool(getattr(settings, "INFOCULTURA_AUTH_COOKIE_SECURE", False)),
            "samesite": getattr(settings, "INFOCULTURA_AUTH_COOKIE_SAMESITE", "Lax"),
            "path": "/",
        }
