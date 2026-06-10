from __future__ import annotations

from pathlib import Path
from uuid import uuid4

from django.core.files.storage import default_storage
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.serializers import AdminAuditLogSerializer, AdminNotificationSerializer, RegistrationStatusSerializer
from ...core.permissions import IsClubAdmin, IsSuperAdmin
from ...models import RegistrationStatus
from ...service_modules.audit import list_admin_audit_logs, record_admin_audit_action
from ...service_modules.dashboard import get_admin_dashboard_metrics, get_admin_notifications
from .common import AdminAuditMixin


class AdminImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    allowed_folders = {'news', 'events', 'books', 'clubs', 'photos'}

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        folder = (request.data.get('folder') or 'news').strip().lower()

        if folder not in self.allowed_folders:
            return Response({'message': 'Pasta de upload invalida.'}, status=400)

        if uploaded_file is None:
            return Response({'message': 'Seleciona um ficheiro para upload.'}, status=400)

        suffix = Path(uploaded_file.name).suffix.lower()
        if suffix not in {'.jpg', '.jpeg', '.png', '.webp', '.gif'}:
            return Response({'message': 'Formato de imagem nao suportado.'}, status=400)

        relative_path = f'infocultura/{folder}/{uuid4().hex}{suffix}'
        stored_path = default_storage.save(relative_path, uploaded_file)
        public_path = default_storage.url(stored_path)
        record_admin_audit_action(
            action='upload',
            content_type='image',
            summary=public_path,
            actor_user=request.user,
            metadata={'folder': folder, 'filename': uploaded_file.name},
        )
        return Response({'path': public_path}, status=201)


class AdminRegistrationStatusListView(generics.ListAPIView):
    serializer_class = RegistrationStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get_queryset(self):
        return RegistrationStatus.objects.all().order_by('name')


class AdminDashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get(self, request):
        return Response(get_admin_dashboard_metrics(user=request.user))


class AdminAuditLogListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get(self, request):
        logs = list_admin_audit_logs(limit=100)
        serializer = AdminAuditLogSerializer(logs, many=True)
        return Response(serializer.data)


class AdminDashboardNotificationsView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get(self, request):
        notifications = get_admin_notifications(user=request.user)
        serializer = AdminNotificationSerializer(notifications, many=True)
        return Response(serializer.data)
