from __future__ import annotations

from django.db.models import Q
from rest_framework import generics, permissions

from ...api.serializers import (
    AdminCategoryWriteSerializer,
    CategorySerializer,
    CulturalContentSerializer,
    PhotoCarouselItemSerializer,
)
from ...core.permissions import IsClubAdmin
from ...models import Category, CulturalContent, PhotoCarouselItem
from .common import AdminAuditDestroyMixin, AdminAuditMixin


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


class AdminPhotoCarouselListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    serializer_class = PhotoCarouselItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'photo'

    def get_queryset(self):
        queryset = PhotoCarouselItem.objects.all()
        section = (self.request.query_params.get('section') or '').strip()
        is_active = (self.request.query_params.get('is_active') or '').strip().lower()

        if section:
            queryset = queryset.filter(section=section)
        if is_active in {'true', 'false'}:
            queryset = queryset.filter(is_active=is_active == 'true')

        return queryset.order_by('section', 'display_order', '-updated_at')


class AdminPhotoCarouselDetailView(AdminAuditDestroyMixin, generics.RetrieveUpdateDestroyAPIView):
    queryset = PhotoCarouselItem.objects.all()
    serializer_class = PhotoCarouselItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]
    audit_content_type = 'photo'


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
