EVENT_WORKFLOW_STATUS_ORDER = ("draft", "review", "published", "archived")
NEWS_WORKFLOW_STATUS_ORDER = ("draft", "review", "published", "archived")
EVENT_STATUS_ALIASES = {
    "rascunho": "draft",
    "publicado": "published",
}


def normalize_workflow_status(value: str | None) -> str:
    normalized = (value or "").strip().lower()
    return EVENT_STATUS_ALIASES.get(normalized, normalized)


def get_role_allowed_workflow_statuses(
    *,
    role_name: str | None,
    base_statuses: tuple[str, ...],
    current_status: str | None = None,
) -> set[str]:
    if role_name == "club_admin":
        allowed_statuses = {"draft", "review"}
        if current_status in {"published", "archived"}:
            allowed_statuses.add(current_status)
        return allowed_statuses

    return set(base_statuses)
