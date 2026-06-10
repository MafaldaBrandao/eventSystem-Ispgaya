from __future__ import annotations

from ...service_modules.audit import record_admin_audit_action


def normalize_audit_object_id(value) -> int | None:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    return None


def describe_audit_target(instance) -> str:
    for field_name in ("title", "name", "email"):
        value = getattr(instance, field_name, None)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return f'id={getattr(instance, "pk", None)}'


def resolve_audit_club_id(instance) -> int | None:
    direct_club_id = getattr(instance, "club_id", None)
    if direct_club_id is not None:
        return direct_club_id

    user = getattr(instance, "user", None)
    if user is not None:
        return getattr(user, "club_id", None)

    return None


def get_allowed_registration_club_id(user) -> int | None:
    role_name = getattr(getattr(user, "role", None), "name", None)
    if role_name == "club_admin":
        return user.club_id
    return None


def get_allowed_club_id(user) -> int | None:
    role_name = getattr(getattr(user, "role", None), "name", None)
    if role_name == "club_admin":
        return user.club_id
    return None


class AdminAuditMixin:
    audit_content_type = "resource"

    def write_audit_entry(
        self,
        request,
        *,
        action: str,
        instance=None,
        summary: str | None = None,
        object_id: int | None = None,
        metadata: dict[str, object] | None = None,
    ) -> None:
        target_instance = instance
        raw_object_id = object_id if object_id is not None else getattr(target_instance, "pk", None)
        resolved_object_id = normalize_audit_object_id(raw_object_id)
        resolved_summary = summary or describe_audit_target(target_instance)
        resolved_metadata = dict(metadata or {})
        if raw_object_id is not None and resolved_object_id is None:
            resolved_metadata["object_pk"] = str(raw_object_id)
        record_admin_audit_action(
            action=action,
            content_type=self.audit_content_type,
            object_id=resolved_object_id,
            summary=resolved_summary,
            actor_user=request.user,
            club_id=resolve_audit_club_id(target_instance) if target_instance is not None else None,
            metadata=resolved_metadata or None,
        )

    def perform_create(self, serializer):
        instance = serializer.save()
        self.write_audit_entry(self.request, action="create", instance=instance)

    def perform_update(self, serializer):
        instance = serializer.save()
        self.write_audit_entry(self.request, action="update", instance=instance)


class AdminAuditDestroyMixin(AdminAuditMixin):
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.write_audit_entry(request, action="delete", instance=instance)
        return super().destroy(request, *args, **kwargs)
