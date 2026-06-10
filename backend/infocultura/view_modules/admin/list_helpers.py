from __future__ import annotations

from dataclasses import dataclass
from typing import Mapping, Any

from rest_framework.response import Response


@dataclass(frozen=True, slots=True)
class AdminListParams:
    club_id: int | None
    status: str | None
    search: str | None
    ordering: str | None
    date_from: str | None
    date_to: str | None
    page: int
    page_size: int


def read_admin_list_params(query_params: Mapping[str, Any], *, default_page_size: int = 10) -> AdminListParams:
    club_id_raw = (query_params.get('club_id') or '').strip()
    status = (query_params.get('status') or '').strip() or None
    search = (query_params.get('search') or '').strip() or None
    ordering = (query_params.get('ordering') or '').strip() or None
    date_from = (query_params.get('date_from') or '').strip() or None
    date_to = (query_params.get('date_to') or '').strip() or None
    page_raw = query_params.get('page', '1')
    page_size_raw = query_params.get('page_size', str(default_page_size))

    page = int(page_raw) if str(page_raw).isdigit() else 1
    page_size = int(page_size_raw) if str(page_size_raw).isdigit() else default_page_size
    club_id = int(club_id_raw) if club_id_raw.isdigit() else None

    return AdminListParams(
        club_id=club_id,
        status=status if status and status != 'all' else None,
        search=search,
        ordering=ordering,
        date_from=date_from,
        date_to=date_to,
        page=page,
        page_size=page_size,
    )


def empty_admin_page_response(*, page: int, page_size: int) -> Response:
    return Response(
        {
            'items': [],
            'total': 0,
            'page': page,
            'page_size': page_size,
            'total_pages': 0,
        }
    )


def resolve_admin_club_id(*, role_name: str | None, user_club_id: int | None, requested_club_id: int | None) -> int | None:
    if role_name == 'club_admin':
        return user_club_id
    return requested_club_id
