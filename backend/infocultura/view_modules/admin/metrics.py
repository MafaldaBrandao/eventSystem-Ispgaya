from __future__ import annotations

from dataclasses import asdict

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ...core.permissions import IsClubAdmin
from ...service_modules.metrics import get_admin_metrics_overview


class AdminMetricsOverviewView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get(self, request):
        period = (request.query_params.get('period') or 'week').strip().lower()
        limit_raw = request.query_params.get('limit', '8')
        limit = int(limit_raw) if str(limit_raw).isdigit() else 8
        try:
            overview = get_admin_metrics_overview(user=request.user, period=period, limit=limit)
        except ValueError as error:
            return Response({'message': str(error)}, status=400)
        return Response(asdict(overview))
