from __future__ import annotations

from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..api.response_builders import build_csv_response, paginate_queryset
from ..api.serializers import NewsletterSerializer, NewsletterSubscriberSerializer
from ..models import Newsletter, NewsletterSubscriber
from ..service_modules.audit import record_admin_audit_action
from ..service_modules.newsletters import list_active_newsletter_subscriber_emails, send_newsletter_email
from ..core.permissions import IsClubAdmin
from django.db.models import Q
from .admin.common import AdminAuditDestroyMixin, AdminAuditMixin


class AdminNewsletterListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    serializer_class = NewsletterSerializer
    audit_content_type = 'newsletter'

    def get_queryset(self):
        queryset = Newsletter.objects.select_related('user')
        status = (self.request.query_params.get('status') or '').strip().lower()
        search = (self.request.query_params.get('search') or '').strip()

        if status and status != 'all':
            queryset = queryset.filter(status__iexact=status)

        if search:
            queryset = queryset.filter(
                Q(title__icontains=search)
                | Q(subject__icontains=search)
                | Q(content__icontains=search)
                | Q(user__name__icontains=search)
            )

        return queryset.order_by('-created_at', '-id')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.title,
                    item.subject,
                    item.status,
                    item.sent_at.isoformat() if item.sent_at else '',
                    item.created_at.isoformat() if item.created_at else '',
                    item.user.name if item.user_id and item.user else '',
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'title', 'subject', 'status', 'sent_at', 'created_at', 'author'],
                filename='infocultura_newsletters.csv',
            )

        return paginate_queryset(
            queryset,
            request=request,
            serializer_class=self.get_serializer_class(),
            context=self.get_serializer_context(),
        )


class AdminNewsletterDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    serializer_class = NewsletterSerializer
    audit_content_type = 'newsletter'

    def get_queryset(self):
        return Newsletter.objects.select_related('user')


class AdminNewsletterSendView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def post(self, request, pk):
        newsletter = get_object_or_404(Newsletter.objects.select_related('user'), pk=pk)
        recipients = list_active_newsletter_subscriber_emails()

        if not recipients:
            return Response({'message': 'Nao existem subscritores ativos.'}, status=400)

        image_url = None
        if newsletter.image:
            image_url = request.build_absolute_uri(newsletter.image)

        send_newsletter_email(
            subject=newsletter.subject,
            body=newsletter.content,
            recipient_list=recipients,
            image_url=image_url,
        )

        newsletter.status = 'sent'
        newsletter.sent_at = timezone.now()
        newsletter.save(update_fields=['status', 'sent_at'])
        record_admin_audit_action(
            action='send',
            content_type='newsletter',
            object_id=newsletter.id,
            summary=newsletter.title,
            actor_user=request.user,
            metadata={'recipients': len(recipients)},
        )
        return Response(
            {
                'newsletter': NewsletterSerializer(newsletter).data,
                'sent': len(recipients),
            }
        )


class AdminNewsletterSubscriberListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    serializer_class = NewsletterSubscriberSerializer
    audit_content_type = 'newsletter_subscriber'

    def get_queryset(self):
        queryset = NewsletterSubscriber.objects.all()
        search = (self.request.query_params.get('search') or '').strip()
        is_active = (self.request.query_params.get('is_active') or '').strip().lower()

        if search:
            queryset = queryset.filter(email__icontains=search)

        if is_active in {'true', '1', 'yes'}:
            queryset = queryset.filter(is_active=True)
        elif is_active in {'false', '0', 'no'}:
            queryset = queryset.filter(is_active=False)

        return queryset.order_by('-subscribed_at', '-id')

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        if request.query_params.get('export') == 'csv':
            rows = [
                [
                    item.id,
                    item.email,
                    '1' if item.is_active else '0',
                    item.subscribed_at.isoformat() if item.subscribed_at else '',
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=['id', 'email', 'is_active', 'subscribed_at'],
                filename='infocultura_newsletter_subscribers.csv',
            )

        return paginate_queryset(
            queryset,
            request=request,
            serializer_class=self.get_serializer_class(),
            context=self.get_serializer_context(),
        )


class AdminNewsletterSubscriberDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    serializer_class = NewsletterSubscriberSerializer
    audit_content_type = 'newsletter_subscriber'

    def get_queryset(self):
        return NewsletterSubscriber.objects.all()
