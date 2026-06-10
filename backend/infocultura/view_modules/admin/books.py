from __future__ import annotations

from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.response_builders import apply_admin_ordering, apply_date_range_filters, build_csv_response, paginate_queryset
from ...api.serializers import AdminBookWriteSerializer, AdminBulkIdsSerializer, BookSerializer
from ...core.permissions import IsClubAdmin
from ...models import Book
from ...service_modules.audit import record_admin_audit_action
from ..admin.common import AdminAuditDestroyMixin, AdminAuditMixin, get_allowed_club_id
from ..admin.list_helpers import read_admin_list_params


class AdminBookListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'book'

    ordering_map = {
        'featured': ('-is_featured', 'title', '-id'),
        'newest': ('-created_at', '-id'),
        'oldest': ('created_at', 'id'),
        'title_asc': ('title', '-id'),
        'title_desc': ('-title', '-id'),
        'year_desc': ('-publication_year', '-id'),
        'year_asc': ('publication_year', '-id'),
        'club_asc': ('club__name', '-id'),
        'club_desc': ('-club__name', '-id'),
    }

    def get_queryset(self):
        queryset = Book.objects.select_related('club')
        params = read_admin_list_params(self.request.query_params)
        allowed_club_id = get_allowed_club_id(self.request.user)

        if allowed_club_id is not None:
            queryset = queryset.filter(club_id=allowed_club_id)
        elif params.club_id is not None:
            queryset = queryset.filter(club_id=params.club_id)
        is_active = (self.request.query_params.get('is_active') or '').strip().lower()
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')
        featured = (self.request.query_params.get('featured') or '').strip().lower()
        if featured in {'true', 'false'}:
            queryset = queryset.filter(is_featured=featured == 'true')
        if params.search:
            queryset = queryset.filter(
                Q(title__icontains=params.search)
                | Q(author__icontains=params.search)
                | Q(summary__icontains=params.search)
                | Q(publisher__icontains=params.search)
                | Q(club__name__icontains=params.search)
            )

        queryset = apply_date_range_filters(queryset, self.request, date_field='created_at__date')
        return apply_admin_ordering(
            queryset,
            self.request,
            default_ordering=('-is_featured', 'title', '-id'),
            ordering_map=self.ordering_map,
        )

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return BookSerializer
        return AdminBookWriteSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.title,
                    item.author,
                    item.club.name if item.club_id else '',
                    item.publication_year,
                    'sim' if item.is_featured else 'nao',
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'title', 'author', 'club', 'publication_year', 'is_featured'],
                filename='infocultura_books.csv',
            )

        return paginate_queryset(
            queryset,
            request=request,
            serializer_class=self.get_serializer_class(),
            context=self.get_serializer_context(),
        )


class AdminBookDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'book'

    def get_queryset(self):
        queryset = Book.objects.select_related('club')
        allowed_club_id = get_allowed_club_id(self.request.user)

        if allowed_club_id is not None:
            return queryset.filter(club_id=allowed_club_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return BookSerializer
        return AdminBookWriteSerializer


class AdminBookBulkDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        queryset = Book.objects.filter(id__in=serializer.validated_data['ids'])
        allowed_club_id = get_allowed_club_id(request.user)
        if allowed_club_id is not None:
            queryset = queryset.filter(club_id=allowed_club_id)

        deleted_ids = list(queryset.values_list('id', flat=True))
        deleted_count = len(deleted_ids)
        queryset.delete()
        if deleted_count:
            record_admin_audit_action(
                action='bulk_delete',
                content_type='book',
                summary=f'{deleted_count} livros removidos',
                actor_user=request.user,
                metadata={'ids': deleted_ids},
            )
        return Response({'deleted': deleted_count})
