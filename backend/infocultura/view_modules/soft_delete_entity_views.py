"""
Specific soft-delete views for Club, Event, News, and Book entities.
"""
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..api.serializers import ClubSerializer, EventSerializer, NewsSerializer, BookSerializer, UserSerializer
from ..models import Club, Event, News, Book, Session, AppUser
from ..core.permissions import IsSuperAdmin
from ..api.serializers_activities import AdminEventReadSerializer
from ..api.serializers_news import AdminNewsReadSerializer
from ..service_modules.audit import record_admin_audit_action
from .soft_delete_views import AdminDeactivateView, AdminActivateView


# ============================================================================
# CLUB
# ============================================================================

class AdminClubDeactivateView(AdminDeactivateView):
    model = Club
    serializer_class = ClubSerializer
    content_type = "club"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


class AdminClubActivateView(AdminActivateView):
    model = Club
    serializer_class = ClubSerializer
    content_type = "club"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


# ============================================================================
# EVENT
# ============================================================================

class AdminEventDeactivateView(AdminDeactivateView):
    model = Event
    serializer_class = AdminEventReadSerializer  # Using read serializer to include editorial_history
    content_type = "event"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


class AdminEventActivateView(AdminActivateView):
    model = Event
    serializer_class = AdminEventReadSerializer
    content_type = "event"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


# ============================================================================
# NEWS
# ============================================================================

class AdminNewsDeactivateView(AdminDeactivateView):
    model = News
    serializer_class = AdminNewsReadSerializer  # Using read serializer to include editorial_history
    content_type = "news"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


class AdminNewsActivateView(AdminActivateView):
    model = News
    serializer_class = AdminNewsReadSerializer
    content_type = "news"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


# ============================================================================
# BOOK
# ============================================================================

class AdminBookDeactivateView(AdminDeactivateView):
    model = Book
    serializer_class = BookSerializer
    content_type = "book"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


class AdminBookActivateView(AdminActivateView):
    model = Book
    serializer_class = BookSerializer
    content_type = "book"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]


# ============================================================================
# SESSION
# ============================================================================

class AdminSessionDeactivateView(AdminDeactivateView):
    model = Session
    serializer_class = None  # Will get SessionSerializer from main serializers
    content_type = "session"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Import here to avoid circular imports
        from ..api.serializers import SessionSerializer
        self.serializer_class = SessionSerializer


class AdminSessionActivateView(AdminActivateView):
    model = Session
    serializer_class = None  # Will get SessionSerializer from main serializers
    content_type = "session"
    
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Import here to avoid circular imports
        from ..api.serializers import SessionSerializer
        self.serializer_class = SessionSerializer


# ============================================================================
# CLUB MEMBER (Soft-Delete Alternative to Remove)
# ============================================================================

class AdminClubMemberDeactivateView(APIView):
    """Deactivate a club member (set club_id to None but keep user.is_active = True)."""
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk, user_pk):
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
