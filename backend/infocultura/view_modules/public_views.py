from __future__ import annotations

from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..api.response_builders import build_calendar_ics_response
from ..api.serializers import (
    BookSerializer,
    CategorySerializer,
    ClubRegistrationCreateSerializer,
    ClubSerializer,
    CulturalContentSerializer,
    EventRegistrationCreateSerializer,
    EventSerializer,
    NewsSerializer,
    NewsStatusSerializer,
    PhotoCarouselItemSerializer,
    SessionRegistrationCreateSerializer,
    SessionSerializer,
)
from ..models import Book, Category, Club, CulturalContent, Event, News, NewsStatus, PhotoCarouselItem, Session
from ..service_modules.calendar import filter_activities_by_range, get_past_activities, get_upcoming_activities


class PublicContentListView(generics.ListAPIView):
    serializer_class = CulturalContentSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = CulturalContent.objects.all()
        area = self.request.query_params.get("area")
        status = self.request.query_params.get("status", "publicado")

        if area:
            queryset = queryset.filter(area=area)
        if status:
            queryset = queryset.filter(status=status)
        if status == "publicado":
            queryset = queryset.filter(date__lte=timezone.localdate())

        return queryset


class PublicPhotoCarouselListView(generics.ListAPIView):
    serializer_class = PhotoCarouselItemSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = PhotoCarouselItem.objects.filter(is_active=True)
        section = (self.request.query_params.get("section") or "").strip()

        if section:
            queryset = queryset.filter(section=section)

        return queryset.order_by("display_order", "-updated_at")


class PublicClubListView(generics.ListAPIView):
    serializer_class = ClubSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Club.objects.filter(is_active=True).order_by("name")


class PublicClubDetailView(generics.RetrieveAPIView):
    serializer_class = ClubSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Club.objects.filter(is_active=True)


class PublicClubRegistrationCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        club = Club.objects.filter(pk=pk, is_active=True).first()
        if not club:
            return Response({"message": "Clube nao encontrado."}, status=404)

        serializer = ClubRegistrationCreateSerializer(
            data=request.data,
            context={"club": club, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"message": "Inscricao submetida com sucesso. Aguarda validacao."}, status=201)


class PublicNewsStatusListView(generics.ListAPIView):
    serializer_class = NewsStatusSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return NewsStatus.objects.all().order_by("name")


class PublicNewsListView(generics.ListAPIView):
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = News.objects.select_related("news_status", "club").filter(
            is_active=True,
            news_status__name__iexact="published",
            published_at__isnull=False,
            published_at__lte=timezone.now(),
        )
        club_id = self.request.query_params.get("club_id")
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        return queryset.order_by("-published_at", "-created_at", "-id")


class PublicNewsDetailView(generics.RetrieveAPIView):
    serializer_class = NewsSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return News.objects.select_related("news_status", "club").filter(
            is_active=True,
            news_status__name__iexact="published",
            published_at__isnull=False,
            published_at__lte=timezone.now(),
        )


class PublicBookListView(generics.ListAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Book.objects.select_related("club").filter(is_active=True, club__is_active=True).filter(
            Q(created_at__isnull=True) | Q(created_at__lte=timezone.now())
        )
        club_id = self.request.query_params.get("club_id")
        if club_id:
            queryset = queryset.filter(club_id=club_id)
        return queryset.order_by("-is_featured", "title", "-id")


class PublicBookDetailView(generics.RetrieveAPIView):
    serializer_class = BookSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Book.objects.select_related("club").filter(is_active=True, club__is_active=True).filter(
            Q(created_at__isnull=True) | Q(created_at__lte=timezone.now())
        )


class PublicSessionListView(generics.ListAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Session.objects.select_related("club").filter(is_active=True, club__is_active=True).filter(
            Q(created_at__isnull=True) | Q(created_at__lte=timezone.now())
        )
        club_id = self.request.query_params.get("club_id")
        date_from = (self.request.query_params.get("date_from") or "").strip()
        date_to = (self.request.query_params.get("date_to") or "").strip()
        state = (self.request.query_params.get("state") or "").strip().lower()

        if club_id:
            queryset = queryset.filter(club_id=club_id)
        if state == "upcoming":
            queryset = get_upcoming_activities(queryset, limit=50)
        elif state == "past":
            queryset = get_past_activities(queryset, limit=50)
        else:
            queryset = filter_activities_by_range(queryset, date_from, date_to)

        return queryset.order_by("session_date", "start_date", "-id")


class PublicSessionDetailView(generics.RetrieveAPIView):
    serializer_class = SessionSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Session.objects.select_related("club").filter(is_active=True, club__is_active=True).filter(
            Q(created_at__isnull=True) | Q(created_at__lte=timezone.now())
        )


class PublicSessionRegistrationCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        session = (
            Session.objects.select_related("club")
            .filter(pk=pk, is_active=True, club__is_active=True)
            .filter(Q(created_at__isnull=True) | Q(created_at__lte=timezone.now()))
            .first()
        )
        if not session:
            return Response({"message": "Sessao nao encontrada."}, status=404)

        serializer = SessionRegistrationCreateSerializer(
            data=request.data,
            context={"session": session, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        registration = serializer.save()
        return Response(
            {
                "message": "Inscricao submetida com sucesso.",
                "status": registration.status,
                "registration_id": registration.id,
            },
            status=201,
        )


class PublicSessionCalendarView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        session = (
            Session.objects.select_related("club")
            .filter(pk=pk, is_active=True, club__is_active=True)
            .filter(Q(created_at__isnull=True) | Q(created_at__lte=timezone.now()))
            .first()
        )
        if not session:
            return Response({"message": "Sessao nao encontrada."}, status=404)

        return build_calendar_ics_response(
            uid_prefix=f"session-{session.id}@infocultura",
            title=session.title,
            description=session.description,
            start_date=session.start_date,
            end_date=session.end_date,
            location=session.location or session.title,
            filename=f"sessao-{session.id}.ics",
        )


class PublicCategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.all().order_by("name")


class PublicEventListView(generics.ListAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        queryset = Event.objects.select_related("user__club").prefetch_related("categories").filter(
            is_active=True,
            user__club__is_active=True
        ).filter(Q(status__iexact="published") | Q(status__iexact="publicado")).filter(
            Q(created_at__isnull=True) | Q(created_at__lte=timezone.now())
        )
        club_id = self.request.query_params.get("club_id")
        category_id = self.request.query_params.get("category_id")
        city = (self.request.query_params.get("city") or "").strip()
        date_from = (self.request.query_params.get("date_from") or "").strip()
        date_to = (self.request.query_params.get("date_to") or "").strip()
        state = (self.request.query_params.get("state") or "").strip().lower()
        now = timezone.now()

        if club_id:
            queryset = queryset.filter(user__club_id=club_id)
        if category_id and category_id.isdigit():
            queryset = queryset.filter(categories__id=int(category_id))
        if city:
            queryset = queryset.filter(Q(city__icontains=city) | Q(location__icontains=city))
        if state == "upcoming":
            queryset = get_upcoming_activities(queryset, limit=50)
        elif state == "ongoing":
            queryset = queryset.filter(start_date__lte=now, end_date__gte=now)
        elif state == "past":
            queryset = get_past_activities(queryset, limit=50)
        else:
            queryset = filter_activities_by_range(queryset, date_from, date_to)

        return queryset.order_by("event_date", "start_date", "-id")


class PublicEventDetailView(generics.RetrieveAPIView):
    serializer_class = EventSerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Event.objects.select_related("user__club").prefetch_related("categories").filter(
            is_active=True,
            user__club__is_active=True
        ).filter(Q(status__iexact="published") | Q(status__iexact="publicado")).filter(
            Q(created_at__isnull=True) | Q(created_at__lte=timezone.now())
        )


class PublicEventRegistrationCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, pk):
        event = (
            Event.objects.select_related("user__club")
            .prefetch_related("categories")
            .filter(pk=pk, is_active=True)
            .filter(user__club__is_active=True)
            .filter(Q(status__iexact="published") | Q(status__iexact="publicado"))
            .filter(Q(created_at__isnull=True) | Q(created_at__lte=timezone.now()))
            .first()
        )
        if not event:
            return Response({"message": "Evento nao encontrado."}, status=404)

        serializer = EventRegistrationCreateSerializer(
            data=request.data,
            context={"event": event, "request": request},
        )
        serializer.is_valid(raise_exception=True)
        registration = serializer.save()
        return Response(
            {
                "message": "Inscricao submetida com sucesso.",
                "status": registration.status,
                "registration_id": registration.id,
            },
            status=201,
        )


class PublicEventCalendarView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request, pk):
        event = (
            Event.objects.select_related("user__club")
            .prefetch_related("categories")
            .filter(pk=pk, is_active=True)
            .filter(user__club__is_active=True)
            .filter(Q(status__iexact="published") | Q(status__iexact="publicado"))
            .filter(Q(created_at__isnull=True) | Q(created_at__lte=timezone.now()))
            .first()
        )
        if not event:
            return Response({"message": "Evento nao encontrado."}, status=404)

        return build_calendar_ics_response(
            uid_prefix=f"event-{event.id}@infocultura",
            title=event.title,
            description=event.description,
            start_date=event.start_date,
            end_date=event.end_date,
            location=event.location or event.city or "Local por definir",
            filename=f"evento-{event.id}.ics",
        )
