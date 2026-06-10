from __future__ import annotations

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.serializers import AdminActivityLogSerializer
from ...core.permissions import IsSuperAdmin
from ...service_modules.audit import list_admin_activity_logs


class AdminActivityLogListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        limit_raw = request.query_params.get('limit', '100')
        limit = int(limit_raw) if str(limit_raw).isdigit() else 100
        source = (request.query_params.get('source') or '').strip().lower() or None
        action = (request.query_params.get('action') or '').strip().lower() or None
        content_type = (request.query_params.get('content_type') or '').strip().lower() or None
        search = (request.query_params.get('search') or '').strip() or None
        club_id_raw = request.query_params.get('club_id')
        club_id = int(club_id_raw) if str(club_id_raw).isdigit() else None

        try:
            logs = list_admin_activity_logs(
                limit=limit,
                source=source,
                action=action,
                content_type=content_type,
                search=search,
                club_id=club_id,
            )
        except ValueError as error:
            return Response({'message': str(error)}, status=400)
        serializer = AdminActivityLogSerializer(logs, many=True)
        return Response({'items': serializer.data, 'total': len(logs)})
