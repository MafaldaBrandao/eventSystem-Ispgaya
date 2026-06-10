from __future__ import annotations

from django.db.models import Q
from rest_framework import generics, permissions

from ...api.response_builders import apply_admin_ordering, apply_date_range_filters, build_csv_response, paginate_queryset
from ...api.serializers import AdminSessionWriteSerializer, SessionSerializer
from ...core.permissions import IsClubAdmin
from ...models import Session
from ..admin.common import AdminAuditDestroyMixin, AdminAuditMixin, get_allowed_club_id
from ..admin.list_helpers import read_admin_list_params


class AdminSessionListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'session'

    ordering_map = {
        'date_asc': ('session_date', 'start_date', '-id'),
        'date_desc': ('-session_date', '-start_date', '-id'),
        'newest': ('-created_at', '-id'),
        'oldest': ('created_at', 'id'),
        'title_asc': ('title', '-id'),
        'title_desc': ('-title', '-id'),
        'club_asc': ('club__name', '-id'),
        'club_desc': ('-club__name', '-id'),
    }

    def get_queryset(self):
        queryset = Session.objects.select_related('club')
        params = read_admin_list_params(self.request.query_params)
        allowed_club_id = get_allowed_club_id(self.request.user)

        if allowed_club_id is not None:
            queryset = queryset.filter(club_id=allowed_club_id)
        elif params.club_id is not None:
            queryset = queryset.filter(club_id=params.club_id)
        is_active = (self.request.query_params.get('is_active') or '').strip().lower()
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        registrations = (self.request.query_params.get('registrations') or '').strip().lower()
        if registrations == 'open':
            queryset = queryset.filter(enable_registrations=True)
        elif registrations == 'closed':
            queryset = queryset.filter(enable_registrations=False)
        location = (self.request.query_params.get('location') or '').strip()
        if location:
            queryset = queryset.filter(location__icontains=location)
        if params.search:
            queryset = queryset.filter(
                Q(name__icontains=params.search)
                | Q(title__icontains=params.search)
                | Q(description__icontains=params.search)
                | Q(club__name__icontains=params.search)
            )

        queryset = apply_date_range_filters(queryset, self.request, date_field='session_date')
        return apply_admin_ordering(
            queryset,
            self.request,
            default_ordering=('session_date', 'start_date', '-id'),
            ordering_map=self.ordering_map,
        )

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SessionSerializer
        return AdminSessionWriteSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.title,
                    item.name,
                    item.club.name if item.club_id else '',
                    item.session_date.isoformat() if item.session_date else '',
                    item.start_date.isoformat() if item.start_date else '',
                    item.end_date.isoformat() if item.end_date else '',
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'title', 'name', 'club', 'session_date', 'start_date', 'end_date'],
                filename='infocultura_sessions.csv',
            )

        return paginate_queryset(
            queryset,
            request=request,
            serializer_class=self.get_serializer_class(),
            context=self.get_serializer_context(),
        )


class AdminSessionDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'session'

    def get_queryset(self):
        queryset = Session.objects.select_related('club')
        allowed_club_id = get_allowed_club_id(self.request.user)

        if allowed_club_id is not None:
            return queryset.filter(club_id=allowed_club_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return SessionSerializer
        return AdminSessionWriteSerializer
