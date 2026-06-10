from __future__ import annotations

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..repositories.universities import search_universities


class UniversitySearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        name = (request.query_params.get('name') or '').strip()
        country = (request.query_params.get('country') or 'Portugal').strip()
        limit = self._parse_int(request.query_params.get('limit'), default=25, minimum=1, maximum=100)
        offset = self._parse_int(request.query_params.get('offset'), default=0, minimum=0, maximum=10000)
        items = search_universities(name=name, country=country, limit=limit, offset=offset)
        return Response({'items': items, 'country': country, 'query': name})

    def _parse_int(self, value: str | None, *, default: int, minimum: int, maximum: int) -> int:
        try:
            parsed = int((value or '').strip())
        except ValueError:
            return default

        return max(minimum, min(maximum, parsed))
