from __future__ import annotations

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.response_builders import apply_admin_ordering, apply_date_range_filters, build_csv_response, paginate_queryset
from ...api.serializers import (
    AdminBulkIdsSerializer,
    AdminBulkStatusUpdateSerializer,
    AdminNewsReadSerializer,
    AdminNewsWriteSerializer,
    NewsStatusSerializer,
    NEWS_WORKFLOW_STATUS_ORDER,
    get_role_allowed_workflow_statuses,
    normalize_workflow_status,
)
from ...core.permissions import IsClubAdmin
from ...models import News, NewsStatus
from ...service_modules.audit import record_admin_audit_action, record_editorial_action
from ...service_modules.workflow import notify_news_workflow_status
from ..admin.common import AdminAuditDestroyMixin, AdminAuditMixin, get_allowed_club_id
from ..admin.list_helpers import read_admin_list_params


class AdminNewsListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'news'

    ordering_map = {
        'newest': ('-published_at', '-created_at', '-id'),
        'oldest': ('published_at', 'created_at', 'id'),
        'title_asc': ('title', '-id'),
        'title_desc': ('-title', '-id'),
        'club_asc': ('club__name', '-id'),
        'club_desc': ('-club__name', '-id'),
        'status_asc': ('news_status__name', '-id'),
        'status_desc': ('-news_status__name', '-id'),
    }

    def get_queryset(self):
        queryset = News.objects.select_related('news_status', 'club')
        role_name = getattr(getattr(self.request.user, 'role', None), 'name', None)
        params = read_admin_list_params(self.request.query_params)

        if role_name == 'club_admin':
            queryset = queryset.filter(club_id=self.request.user.club_id)
        elif params.club_id is not None:
            queryset = queryset.filter(club_id=params.club_id)

        if params.status:
            queryset = queryset.filter(news_status__name__iexact=params.status)
        if params.search:
            queryset = queryset.filter(
                Q(title__icontains=params.search)
                | Q(summary__icontains=params.search)
                | Q(content__icontains=params.search)
                | Q(club__name__icontains=params.search)
            )

        queryset = apply_date_range_filters(queryset, self.request, date_field='created_at__date')
        return apply_admin_ordering(
            queryset,
            self.request,
            default_ordering=('-published_at', '-created_at', '-id'),
            ordering_map=self.ordering_map,
        )

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminNewsReadSerializer
        return AdminNewsWriteSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.title,
                    item.club.name if item.club_id else '',
                    item.news_status.name if item.news_status_id else '',
                    item.published_at.isoformat() if item.published_at else '',
                    item.created_at.isoformat() if item.created_at else '',
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'title', 'club', 'status', 'published_at', 'created_at'],
                filename='infocultura_news.csv',
            )

        return paginate_queryset(
            queryset,
            request=request,
            serializer_class=self.get_serializer_class(),
            context=self.get_serializer_context(),
        )


class AdminNewsStatusListView(generics.ListAPIView):
    serializer_class = NewsStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get_queryset(self):
        return NewsStatus.objects.all().order_by('name')


class AdminNewsDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'news'

    def get_queryset(self):
        queryset = News.objects.select_related('news_status', 'club')
        role_name = getattr(getattr(self.request.user, 'role', None), 'name', None)

        if role_name == 'club_admin':
            return queryset.filter(club_id=self.request.user.club_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminNewsReadSerializer
        return AdminNewsWriteSerializer


class AdminNewsBulkStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_status = normalize_workflow_status(serializer.validated_data['status'])
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)
        queryset = News.objects.select_related('news_status', 'club').filter(
            id__in=serializer.validated_data['ids']
        )

        if role_name == 'club_admin':
            queryset = queryset.filter(club_id=request.user.club_id)

        news_status = NewsStatus.objects.filter(name__iexact=target_status).first()
        if news_status is None:
            return Response({'message': 'Estado editorial invalido.'}, status=400)

        items = list(queryset)
        for item in items:
            allowed_statuses = get_role_allowed_workflow_statuses(
                role_name=role_name,
                base_statuses=NEWS_WORKFLOW_STATUS_ORDER,
                current_status=normalize_workflow_status(item.news_status.name),
            )
            if target_status not in allowed_statuses:
                return Response(
                    {'message': 'Um ou mais registos nao podem passar para esse estado.'},
                    status=400,
                )

        updated_items = []
        for item in items:
            previous_status = item.news_status.name
            item.news_status = news_status
            item.updated_at = timezone.now()
            if target_status == 'published' and not item.published_at:
                item.published_at = timezone.now()
            elif target_status in {'draft', 'review'}:
                item.published_at = None
            item.save(update_fields=['news_status', 'updated_at', 'published_at'])
            record_editorial_action(
                content_type='news',
                object_id=item.id,
                from_status=previous_status,
                to_status=news_status.name,
                actor_user=request.user,
                club_id=item.club_id,
            )
            notify_news_workflow_status(
                news=item,
                previous_status=previous_status,
                next_status=news_status.name,
            )
            updated_items.append(item)

        output = AdminNewsReadSerializer(updated_items, many=True)
        if updated_items:
            record_admin_audit_action(
                action='bulk_update_status',
                content_type='news',
                summary=f'{len(updated_items)} noticias atualizadas',
                actor_user=request.user,
                metadata={'ids': [item.id for item in updated_items], 'status': news_status.name},
            )
        return Response({'items': output.data, 'updated': len(updated_items)})


class AdminNewsBulkDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        queryset = News.objects.filter(id__in=serializer.validated_data['ids'])
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)
        if role_name == 'club_admin':
            queryset = queryset.filter(club_id=request.user.club_id)

        deleted_ids = list(queryset.values_list('id', flat=True))
        deleted_count = len(deleted_ids)
        queryset.delete()
        if deleted_count:
            record_admin_audit_action(
                action='bulk_delete',
                content_type='news',
                summary=f'{deleted_count} noticias removidas',
                actor_user=request.user,
                metadata={'ids': deleted_ids},
            )
        return Response({'deleted': deleted_count})
