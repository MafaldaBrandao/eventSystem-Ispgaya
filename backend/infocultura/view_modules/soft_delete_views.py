"""
Base views for soft-delete operations (deactivate/activate).
These views provide a unified pattern for managing entity lifecycle using is_active flag.
"""
from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..core.permissions import IsClubAdmin, IsSuperAdmin
from ..service_modules.audit import record_admin_audit_action


class SoftDeleteBaseMixin:
    """Mixin for soft-delete operations (deactivate/activate)."""
    
    # Override these in subclasses
    model = None  # e.g., Club, Event, News, Book, Session
    serializer_class = None  # e.g., ClubSerializer, EventSerializer
    content_type = None  # e.g., "club", "event", "news" for audit logging
    get_summary_field = None  # Function to get summary for audit log
    get_club_id_field = None  # Function to get club_id for audit log
    
    @staticmethod
    def default_get_summary(obj):
        """Default summary: tries obj.name, obj.email, obj.title, str(obj)."""
        return getattr(obj, 'name', None) or getattr(obj, 'email', None) or getattr(obj, 'title', None) or str(obj)
    
    @staticmethod
    def default_get_club_id(obj):
        """Default club_id lookup: tries obj.club_id, obj.club.id."""
        if hasattr(obj, 'club_id'):
            return obj.club_id
        elif hasattr(obj, 'club'):
            return getattr(obj.club, 'id', None)
        return None


class AdminDeactivateView(SoftDeleteBaseMixin, APIView):
    """Generic deactivate view. Subclass and set model, serializer_class, content_type."""
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        if not self.model or not self.serializer_class or not self.content_type:
            return Response({"message": "View not properly configured."}, status=500)
        
        obj = self.model.objects.filter(pk=pk).first()
        if not obj:
            return Response({"message": f"{self.content_type.capitalize()} not found."}, status=404)
        
        obj.is_active = False
        obj.save(update_fields=["is_active"])
        
        summary = (self.get_summary_field or self.default_get_summary)(obj)
        club_id = (self.get_club_id_field or self.default_get_club_id)(obj)
        
        record_admin_audit_action(
            action="deactivate",
            content_type=self.content_type,
            object_id=obj.id,
            summary=summary,
            actor_user=request.user,
            club_id=club_id,
        )
        return Response({self.content_type: self.serializer_class(obj).data})


class AdminActivateView(SoftDeleteBaseMixin, APIView):
    """Generic activate view. Subclass and set model, serializer_class, content_type."""
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        if not self.model or not self.serializer_class or not self.content_type:
            return Response({"message": "View not properly configured."}, status=500)
        
        obj = self.model.objects.filter(pk=pk).first()
        if not obj:
            return Response({"message": f"{self.content_type.capitalize()} not found."}, status=404)
        
        obj.is_active = True
        obj.save(update_fields=["is_active"])
        
        summary = (self.get_summary_field or self.default_get_summary)(obj)
        club_id = (self.get_club_id_field or self.default_get_club_id)(obj)
        
        record_admin_audit_action(
            action="activate",
            content_type=self.content_type,
            object_id=obj.id,
            summary=summary,
            actor_user=request.user,
            club_id=club_id,
        )
        return Response({self.content_type: self.serializer_class(obj).data})
