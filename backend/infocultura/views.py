from .view_modules.auth_views import (
    LoginView,
    LogoutView,
    MeView,
    RefreshTokenView,
)
from .view_modules.admin_events import (
    AdminAuditLogListView,
    AdminBookBulkDeleteView,
    AdminBookDetailView,
    AdminBookListCreateView,
    AdminCategoryDetailView,
    AdminCategoryListCreateView,
    AdminClubDetailView,
    AdminClubListCreateView,
    AdminClubMemberAssignView,
    AdminClubMemberRemoveView,
    AdminDashboardNotificationsView,
    AdminDashboardSummaryView,
    AdminEventBulkDeleteView,
    AdminEventbriteConnectionView,
    AdminEventBulkStatusUpdateView,
    AdminEventDetailView,
    AdminEventEventbriteAttendeesView,
    AdminEventEventbriteDetailView,
    AdminEventEventbriteOrdersView,
    AdminEventEventbriteSyncView,
    AdminEventEventbriteTicketClassView,
    AdminEventListCreateView,
    AdminImageUploadView,
    AdminRegistrationBulkStatusUpdateView,
    AdminRegistrationListView,
    AdminRegistrationStatusListView,
    AdminRegistrationStatusUpdateView,
    AdminSessionDetailView,
    AdminSessionListCreateView,
    AdminEventSeatingView,
    AdminEventSeatingPaintView,
    AdminEventSeatingSyncView,
)
from .view_modules.admin.logs import AdminActivityLogListView
from .view_modules.admin.metrics import AdminMetricsOverviewView
from .view_modules.admin_news import (
    AdminContentDetailView,
    AdminContentListCreateView,
    AdminNewsBulkDeleteView,
    AdminNewsBulkStatusUpdateView,
    AdminNewsDetailView,
    AdminNewsListCreateView,
    AdminNewsStatusListView,
    AdminPhotoCarouselDetailView,
    AdminPhotoCarouselListCreateView,
)
from .view_modules.admin_newsletters import (
    AdminNewsletterDetailView,
    AdminNewsletterListCreateView,
    AdminNewsletterSendView,
    AdminNewsletterSubscriberDetailView,
    AdminNewsletterSubscriberListCreateView,
)
from .view_modules.admin_users import (
    AdminRoleListView,
    AdminUserActivateView,
    AdminUserDeactivateView,
    AdminUserDetailView,
    AdminUserListCreateView,
)
from .view_modules.metrics_views import TrackMetricView
from .view_modules.public_views import (
    PublicBookDetailView,
    PublicBookListView,
    PublicCategoryListView,
    PublicClubDetailView,
    PublicClubListView,
    PublicClubRegistrationCreateView,
    PublicContentListView,
    PublicEventCalendarView,
    PublicEventDetailView,
    PublicEventListView,
    PublicEventRegistrationCreateView,
    PublicNewsDetailView,
    PublicNewsListView,
    PublicNewsStatusListView,
    PublicPhotoCarouselListView,
    PublicSessionCalendarView,
    PublicSessionDetailView,
    PublicSessionListView,
    PublicSessionRegistrationCreateView,
)
from .view_modules.university_views import UniversitySearchView

__all__ = [
    'AdminAuditLogListView',
    'AdminActivityLogListView',
    'AdminBookBulkDeleteView',
    'AdminBookDetailView',
    'AdminBookListCreateView',
    'AdminCategoryDetailView',
    'AdminCategoryListCreateView',
    'AdminClubDetailView',
    'AdminClubListCreateView',
    'AdminClubMemberAssignView',
    'AdminClubMemberRemoveView',
    'AdminContentDetailView',
    'AdminContentListCreateView',
    'AdminDashboardNotificationsView',
    'AdminDashboardSummaryView',
    'AdminEventBulkDeleteView',
    'AdminEventbriteConnectionView',
    'AdminEventBulkStatusUpdateView',
    'AdminEventDetailView',
    'AdminEventEventbriteAttendeesView',
    'AdminEventEventbriteDetailView',
    'AdminEventEventbriteOrdersView',
    'AdminEventEventbriteSyncView',
    'AdminEventEventbriteTicketClassView',
    'AdminEventListCreateView',
    'AdminImageUploadView',
    'AdminEventSeatingView',
    'AdminEventSeatingPaintView',
    'AdminEventSeatingSyncView',
    'AdminMetricsOverviewView',
    'AdminNewsBulkDeleteView',
    'AdminNewsBulkStatusUpdateView',
    'AdminNewsDetailView',
    'AdminNewsListCreateView',
    'AdminNewsStatusListView',
    'AdminPhotoCarouselDetailView',
    'AdminPhotoCarouselListCreateView',
    'AdminNewsletterDetailView',
    'AdminNewsletterListCreateView',
    'AdminNewsletterSendView',
    'AdminNewsletterSubscriberDetailView',
    'AdminNewsletterSubscriberListCreateView',
    'AdminRegistrationBulkStatusUpdateView',
    'AdminRegistrationListView',
    'AdminRegistrationStatusListView',
    'AdminRegistrationStatusUpdateView',
    'AdminRoleListView',
    'AdminUserActivateView',
    'AdminSessionDetailView',
    'AdminSessionListCreateView',
    'AdminUserDeactivateView',
    'AdminUserDetailView',
    'AdminUserListCreateView',
    'LoginView',
    'LogoutView',
    'MeView',
    'PublicBookDetailView',
    'PublicBookListView',
    'PublicCategoryListView',
    'PublicClubDetailView',
    'PublicClubListView',
    'PublicClubRegistrationCreateView',
    'PublicContentListView',
    'PublicEventCalendarView',
    'PublicEventDetailView',
    'PublicEventListView',
    'PublicEventRegistrationCreateView',
    'PublicNewsDetailView',
    'PublicNewsListView',
    'PublicNewsStatusListView',
    'PublicPhotoCarouselListView',
    'PublicSessionCalendarView',
    'PublicSessionDetailView',
    'PublicSessionListView',
    'PublicSessionRegistrationCreateView',
    'RefreshTokenView',
    'TrackMetricView',
    'UniversitySearchView',
]

"""
from pathlib import Path


class AdminImageUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    allowed_folders = {'news', 'events', 'books', 'clubs'}

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


def get_allowed_registration_club_id(user) -> int | None:
    role_name = getattr(getattr(user, 'role', None), 'name', None)
    if role_name == 'club_admin':
        return user.club_id
    return None


def get_allowed_club_id(user) -> int | None:
    role_name = getattr(getattr(user, 'role', None), 'name', None)
    if role_name == 'club_admin':
        return user.club_id
    return None


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


class AdminRegistrationListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get(self, request):
        club_id_raw = request.query_params.get('club_id')
        status = request.query_params.get('status')
        search = request.query_params.get('search')
        ordering = (request.query_params.get('ordering') or '').strip() or None
        date_from = (request.query_params.get('date_from') or '').strip() or None
        date_to = (request.query_params.get('date_to') or '').strip() or None
        page_raw = request.query_params.get('page', '1')
        page_size_raw = request.query_params.get('page_size', '10')
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)
        page = int(page_raw) if page_raw.isdigit() else 1
        page_size = int(page_size_raw) if page_size_raw.isdigit() else 10

        if role_name == 'club_admin' and not request.user.club_id:
            return Response(
                {
                    'items': [],
                    'total': 0,
                    'page': page,
                    'page_size': page_size,
                    'total_pages': 0,
                },
                status=200,
            )

        if role_name == 'club_admin':
            club_id = request.user.club_id
        else:
            club_id = int(club_id_raw) if club_id_raw and club_id_raw.isdigit() else None

        registration_page = list_admin_club_registrations(
            club_id=club_id,
            status=status if status and status != 'all' else None,
            search=search,
            ordering=ordering,
            date_from=date_from,
            date_to=date_to,
            allowed_club_id=get_allowed_registration_club_id(request.user),
            page=page,
            page_size=page_size,
        )

        if request.query_params.get('export') == 'csv':
            export_page = list_admin_club_registrations(
                club_id=club_id,
                status=status if status and status != 'all' else None,
                search=search,
                ordering=ordering,
                date_from=date_from,
                date_to=date_to,
                allowed_club_id=get_allowed_registration_club_id(request.user),
                export_all=True,
            )
            rows = [
                [
                    item.registration_id,
                    item.club_name,
                    item.name,
                    item.email,
                    item.phone or '',
                    item.message or '',
                    item.status,
                    item.created_at.isoformat() if item.created_at else '',
                ]
                for item in export_page.items
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'club', 'name', 'email', 'phone', 'message', 'status', 'created_at'],
                filename='infocultura_registrations.csv',
            )

        serializer = AdminClubRegistrationSerializer(registration_page.items, many=True)
        return Response(
            {
                'items': serializer.data,
                'total': registration_page.total,
                'page': registration_page.page,
                'page_size': registration_page.page_size,
                'total_pages': registration_page.total_pages,
            }
        )


class AdminRegistrationStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def patch(self, request, pk):
        serializer = AdminRegistrationStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        updated_record = update_admin_club_registration_status(
            registration_id=pk,
            registration_status=serializer.validated_data['registration_status'].name,
            allowed_club_id=get_allowed_registration_club_id(request.user),
        )

        if updated_record is None:
            return Response({'message': 'Inscricao nao encontrada.'}, status=404)

        record_admin_audit_action(
            action='update_status',
            content_type='registration',
            object_id=updated_record.registration_id,
            summary=updated_record.email,
            actor_user=request.user,
            club_id=updated_record.club_id,
            metadata={'status': updated_record.status},
        )
        output = AdminClubRegistrationSerializer(updated_record)
        return Response({'registration': output.data})


class AdminRegistrationBulkStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        status_serializer = AdminRegistrationStatusUpdateSerializer(
            data={'status': serializer.validated_data['status']}
        )
        status_serializer.is_valid(raise_exception=True)

        updated_items = []
        for registration_id in serializer.validated_data['ids']:
            updated_record = update_admin_club_registration_status(
                registration_id=registration_id,
                registration_status=status_serializer.validated_data['registration_status'].name,
                allowed_club_id=get_allowed_registration_club_id(request.user),
            )

            if updated_record:
                updated_items.append(updated_record)

        if updated_items:
            record_admin_audit_action(
                action='bulk_update_status',
                content_type='registration',
                summary=f'{len(updated_items)} inscricoes atualizadas',
                actor_user=request.user,
                metadata={'ids': [item.registration_id for item in updated_items]},
            )
        output = AdminClubRegistrationSerializer(updated_items, many=True)
        return Response({'items': output.data, 'updated': len(updated_items)})


class AdminContentListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    serializer_class = CulturalContentSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'content'

    def get_queryset(self):
        queryset = CulturalContent.objects.all()
        area = self.request.query_params.get('area')
        status = self.request.query_params.get('status')

        if area:
            queryset = queryset.filter(area=area)
        if status:
            queryset = queryset.filter(status=status)

        return queryset


class AdminContentDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = CulturalContent.objects.all()
    serializer_class = CulturalContentSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'content'


class AdminNewsStatusListView(generics.ListAPIView):
    serializer_class = NewsStatusSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get_queryset(self):
        return NewsStatus.objects.all().order_by('name')


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
        club_id = self.request.query_params.get('club_id')
        status = (self.request.query_params.get('status') or '').strip().lower()
        search = (self.request.query_params.get('search') or '').strip()

        if role_name == 'club_admin':
            queryset = queryset.filter(club_id=self.request.user.club_id)
        elif club_id and club_id.isdigit():
            queryset = queryset.filter(club_id=int(club_id))

        if status and status != 'all':
            queryset = queryset.filter(news_status__name__iexact=status)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(summary__icontains=search)
                | Q(content__icontains=search)
                | Q(club__name__icontains=search)
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
        allowed_club_id = get_allowed_club_id(self.request.user)
        club_id = self.request.query_params.get('club_id')
        search = (self.request.query_params.get('search') or '').strip()

        if allowed_club_id is not None:
            queryset = queryset.filter(club_id=allowed_club_id)
        elif club_id and club_id.isdigit():
            queryset = queryset.filter(club_id=int(club_id))
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(author__icontains=search)
                | Q(summary__icontains=search)
                | Q(publisher__icontains=search)
                | Q(club__name__icontains=search)
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
        allowed_club_id = get_allowed_club_id(self.request.user)
        club_id = self.request.query_params.get('club_id')
        search = (self.request.query_params.get('search') or '').strip()

        if allowed_club_id is not None:
            queryset = queryset.filter(club_id=allowed_club_id)
        elif club_id and club_id.isdigit():
            queryset = queryset.filter(club_id=int(club_id))
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(club__name__icontains=search)
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


class AdminEventListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'event'

    ordering_map = {
        'date_asc': ('event_date', 'start_date', '-id'),
        'date_desc': ('-event_date', '-start_date', '-id'),
        'newest': ('-created_at', '-id'),
        'oldest': ('created_at', 'id'),
        'title_asc': ('title', '-id'),
        'title_desc': ('-title', '-id'),
        'club_asc': ('user__club__name', '-id'),
        'club_desc': ('-user__club__name', '-id'),
        'status_asc': ('status', '-id'),
        'status_desc': ('-status', '-id'),
    }

    def get_queryset(self):
        queryset = Event.objects.select_related('user__club').prefetch_related('categories')
        allowed_club_id = get_allowed_club_id(self.request.user)
        club_id = self.request.query_params.get('club_id')
        category_id = self.request.query_params.get('category_id')
        status = (self.request.query_params.get('status') or '').strip().lower()
        search = (self.request.query_params.get('search') or '').strip()

        if allowed_club_id is not None:
            queryset = queryset.filter(user__club_id=allowed_club_id)
        elif club_id and club_id.isdigit():
            queryset = queryset.filter(user__club_id=int(club_id))

        if category_id and category_id.isdigit():
            queryset = queryset.filter(categories__id=int(category_id))
        if status and status != 'all':
            queryset = queryset.filter(status__iexact=status)
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(description__icontains=search)
                | Q(city__icontains=search)
                | Q(location__icontains=search)
                | Q(user__club__name__icontains=search)
            )

        queryset = apply_date_range_filters(queryset, self.request, date_field='event_date')
        queryset = apply_admin_ordering(
            queryset,
            self.request,
            default_ordering=('event_date', 'start_date', '-id'),
            ordering_map=self.ordering_map,
        )
        return queryset.distinct()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminEventReadSerializer
        return AdminEventWriteSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.title,
                    item.user.club.name if item.user_id and item.user and item.user.club else '',
                    item.status,
                    item.event_date.isoformat() if item.event_date else '',
                    item.start_date.isoformat() if item.start_date else '',
                    item.location,
                    ', '.join(item.categories.values_list('name', flat=True)),
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'title', 'club', 'status', 'event_date', 'start_date', 'location', 'categories'],
                filename='infocultura_events.csv',
            )

        return paginate_queryset(
            queryset,
            request=request,
            serializer_class=self.get_serializer_class(),
            context=self.get_serializer_context(),
        )


class AdminEventDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'event'

    def get_queryset(self):
        queryset = Event.objects.select_related('user__club').prefetch_related('categories')
        allowed_club_id = get_allowed_club_id(self.request.user)

        if allowed_club_id is not None:
            return queryset.filter(user__club_id=allowed_club_id)

        return queryset

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return AdminEventReadSerializer
        return AdminEventWriteSerializer


class AdminEventBulkStatusUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkStatusUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        target_status = normalize_workflow_status(serializer.validated_data['status'])
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)
        queryset = Event.objects.select_related('user__club').prefetch_related('categories').filter(
            id__in=serializer.validated_data['ids']
        )

        if role_name == 'club_admin':
            queryset = queryset.filter(user__club_id=request.user.club_id)

        items = list(queryset)
        for item in items:
            allowed_statuses = get_role_allowed_workflow_statuses(
                role_name=role_name,
                base_statuses=EVENT_WORKFLOW_STATUS_ORDER,
                current_status=normalize_workflow_status(item.status),
            )
            if target_status not in allowed_statuses:
                return Response(
                    {'message': 'Um ou mais eventos nao podem passar para esse estado.'},
                    status=400,
                )

        updated_items = []
        for item in items:
            previous_status = item.status
            item.status = target_status
            item.updated_at = timezone.now()
            item.save(update_fields=['status', 'updated_at'])
            record_editorial_action(
                content_type='event',
                object_id=item.id,
                from_status=previous_status,
                to_status=target_status,
                actor_user=request.user,
                club_id=item.user.club_id if item.user_id and item.user else None,
            )
            notify_event_workflow_status(
                event=item,
                previous_status=previous_status,
                next_status=target_status,
            )
            updated_items.append(item)

        output = AdminEventReadSerializer(updated_items, many=True)
        if updated_items:
            record_admin_audit_action(
                action='bulk_update_status',
                content_type='event',
                summary=f'{len(updated_items)} eventos atualizados',
                actor_user=request.user,
                metadata={'ids': [item.id for item in updated_items], 'status': target_status},
            )
        return Response({'items': output.data, 'updated': len(updated_items)})


class AdminEventBulkDeleteView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request):
        serializer = AdminBulkIdsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        queryset = Event.objects.filter(id__in=serializer.validated_data['ids'])
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)
        if role_name == 'club_admin':
            queryset = queryset.filter(user__club_id=request.user.club_id)

        deleted_ids = list(queryset.values_list('id', flat=True))
        deleted_count = len(deleted_ids)
        queryset.delete()
        if deleted_count:
            record_admin_audit_action(
                action='bulk_delete',
                content_type='event',
                summary=f'{deleted_count} eventos removidos',
                actor_user=request.user,
                metadata={'ids': deleted_ids},
            )
        return Response({'deleted': deleted_count})


class AdminCategoryListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'category'

    def get_queryset(self):
        return Category.objects.all().order_by('name')

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CategorySerializer
        return AdminCategoryWriteSerializer


class AdminCategoryDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    queryset = Category.objects.all().order_by('name')
    audit_content_type = 'category'

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return CategorySerializer
        return AdminCategoryWriteSerializer


class AdminClubListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    audit_content_type = 'club'

    def get_queryset(self):
        queryset = Club.objects.all()
        search = (self.request.query_params.get('search') or '').strip()

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(description__icontains=search)
                | Q(mission__icontains=search)
            )

        queryset = apply_date_range_filters(queryset, self.request, date_field='created_at__date')
        return queryset.order_by('name')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.name,
                    item.description or '',
                    item.mission or '',
                    'sim' if item.is_active else 'nao',
                    'sim' if item.enable_registrations else 'nao',
                    item.created_at.isoformat() if item.created_at else '',
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=[
                    'id',
                    'name',
                    'description',
                    'mission',
                    'is_active',
                    'enable_registrations',
                    'created_at',
                ],
                filename='infocultura_clubs.csv',
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AdminClubDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = Club.objects.all()
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    audit_content_type = 'club'

    def destroy(self, request, *args, **kwargs):
        club = self.get_object()
        if AppUser.objects.filter(club=club).exists():
            return Response(
                {'message': 'Nao podes apagar um clube com utilizadores associados.'},
                status=400,
            )

        try:
            return super().destroy(request, *args, **kwargs)
        except DatabaseError:
            return Response(
                {
                    'message':
                        'Erro ao apagar o clube. Verifica se existem dependências na base de dados e tenta novamente.'
                },
                status=400,
            )


class AdminClubMemberAssignView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        club = Club.objects.filter(pk=pk).first()
        if not club:
            return Response({'message': 'Clube nao encontrado.'}, status=404)

        serializer = ClubMemberAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data['user']
        user.club = club
        user.save(update_fields=['club'])
        record_admin_audit_action(
            action='assign_member',
            content_type='club',
            object_id=club.id,
            summary=club.name,
            actor_user=request.user,
            club_id=club.id,
            metadata={'user_id': user.id, 'user_email': user.email},
        )

        return Response({'user': UserSerializer(user).data, 'club': ClubSerializer(club).data})


class AdminClubMemberRemoveView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def delete(self, request, pk, user_pk):
        club = Club.objects.filter(pk=pk).first()
        if not club:
            return Response({'message': 'Clube nao encontrado.'}, status=404)

        user = AppUser.objects.select_related('role', 'club').filter(pk=user_pk).first()
        if not user:
            return Response({'message': 'Utilizador nao encontrado.'}, status=404)

        if user.club_id != club.id:
            return Response(
                {'message': 'O utilizador nao pertence a este clube.'},
                status=400,
            )

        user.club = None
        user.save(update_fields=['club'])
        record_admin_audit_action(
            action='remove_member',
            content_type='club',
            object_id=club.id,
            summary=club.name,
            actor_user=request.user,
            club_id=club.id,
            metadata={'user_id': user.id, 'user_email': user.email},
        )
        return Response({'user': UserSerializer(user).data})
    """
