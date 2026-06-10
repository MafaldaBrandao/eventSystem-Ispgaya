from __future__ import annotations

from django.db.models import Q
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ..api.serializers import LoginSerializer, RoleSerializer, UserSerializer, AdminUserWriteSerializer
from ..core.auth_services import AuthCookieManager, LoginIdentity, LoginRateLimiter
from ..core.permissions import IsClubAdmin, IsSuperAdmin
from ..core.security import (
    check_password_hash,
    decode_refresh_token,
    is_refresh_token_revoked,
    issue_token_pair,
    revoke_refresh_token,
)
from ..core.utils import get_client_ip
from ..models import AppUser, Role
from ..service_modules.audit import record_admin_audit_action
from .admin.common import AdminAuditMixin, get_allowed_club_id
from ..api.response_builders import apply_date_range_filters, build_csv_response


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    rate_limiter = LoginRateLimiter()
    cookie_manager = AuthCookieManager()

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        identifier = serializer.validated_data["username"]
        password = serializer.validated_data["password"]
        identity = LoginIdentity(client_ip=get_client_ip(request), identifier=identifier)

        if self.rate_limiter.is_locked(identity):
            return Response({"message": self.rate_limiter.config.lockout_message}, status=429)

        user = (
            AppUser.objects.select_related("role", "club")
            .filter(Q(email__iexact=identifier) | Q(name__iexact=identifier))
            .first()
        )

        if not user or not user.is_active:
            locked = self.rate_limiter.record_failure(identity)
            if locked:
                return Response({"message": self.rate_limiter.config.lockout_message}, status=429)
            return Response({"message": "Credenciais invalidas."}, status=401)

        if not check_password_hash(password, user.password_hash):
            locked = self.rate_limiter.record_failure(identity)
            if locked:
                return Response({"message": self.rate_limiter.config.lockout_message}, status=429)
            return Response({"message": "Credenciais invalidas."}, status=401)

        self.rate_limiter.clear_failures(identity)
        access_token, refresh_token = issue_token_pair(
            user_id=user.id,
            role_name=user.role.name,
            email=user.email,
            name=user.name,
        )

        response = Response({"token": access_token, "user": UserSerializer(user).data})
        self.cookie_manager.attach(response, access_token=access_token, refresh_token=refresh_token)
        return response


class RefreshTokenView(APIView):
    permission_classes = [permissions.AllowAny]
    cookie_manager = AuthCookieManager()

    def post(self, request):
        refresh_token = request.COOKIES.get(self.cookie_manager.configured_refresh_cookie_name())
        if not refresh_token:
            return Response({"message": "Refresh token em falta."}, status=401)

        try:
            payload = decode_refresh_token(refresh_token)
        except Exception:
            response = Response({"message": "Refresh token invalido."}, status=401)
            self.cookie_manager.clear(response)
            return response

        if is_refresh_token_revoked(payload):
            response = Response({"message": "Refresh token revogado."}, status=401)
            self.cookie_manager.clear(response)
            return response

        user_id = payload.get("sub")
        user = AppUser.objects.select_related("role", "club").filter(id=user_id, is_active=True).first()
        if not user:
            response = Response({"message": "Utilizador nao encontrado ou inativo."}, status=401)
            self.cookie_manager.clear(response)
            return response

        revoke_refresh_token(payload)
        access_token, next_refresh_token = issue_token_pair(
            user_id=user.id,
            role_name=user.role.name,
            email=user.email,
            name=user.name,
        )
        response = Response({"token": access_token, "user": UserSerializer(user).data})
        self.cookie_manager.attach(response, access_token=access_token, refresh_token=next_refresh_token)
        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]
    cookie_manager = AuthCookieManager()

    def post(self, request):
        refresh_token = request.COOKIES.get(self.cookie_manager.configured_refresh_cookie_name())
        if refresh_token:
            try:
                revoke_refresh_token(decode_refresh_token(refresh_token))
            except Exception:
                pass

        response = Response({"message": "Sessao terminada."}, status=200)
        self.cookie_manager.clear(response)
        return response


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({"user": UserSerializer(request.user).data})


class AdminRoleListView(generics.ListAPIView):
    serializer_class = RoleSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        return Role.objects.all().order_by("name")


class AdminUserListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    queryset = AppUser.objects.select_related("role", "club").all()
    audit_content_type = "user"

    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return UserSerializer
        return AdminUserWriteSerializer

    def get_queryset(self):
        queryset = AppUser.objects.select_related("role", "club")
        allowed_club_id = get_allowed_club_id(self.request.user)
        search = (self.request.query_params.get("search") or "").strip()

        if allowed_club_id is not None:
            queryset = queryset.filter(club_id=allowed_club_id)

        if search:
            queryset = queryset.filter(
                Q(name__icontains=search)
                | Q(email__icontains=search)
                | Q(role__name__icontains=search)
                | Q(club__name__icontains=search)
            )

        queryset = apply_date_range_filters(queryset, self.request, date_field="created_at__date")
        return queryset.order_by("-is_active", "name", "email")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())

        if request.query_params.get("export") == "csv":
            rows = [
                [
                    item.id,
                    item.name,
                    item.email,
                    item.role.name if item.role_id else "",
                    item.club.name if item.club_id and item.club else "",
                    "sim" if item.is_active else "nao",
                    item.created_at.isoformat() if item.created_at else "",
                ]
                for item in queryset
            ]
            return build_csv_response(
                rows=rows,
                headers=["id", "name", "email", "role", "club", "is_active", "created_at"],
                filename="infocultura_users.csv",
            )

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class AdminUserDetailView(AdminAuditMixin, generics.RetrieveUpdateAPIView):
    queryset = AppUser.objects.select_related("role", "club").all()
    audit_content_type = "user"

    def get_permissions(self):
        permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
        return [permission() for permission in permission_classes]

    def get_serializer_class(self):
        if self.request.method == "GET":
            return UserSerializer
        return AdminUserWriteSerializer

    def get_queryset(self):
        queryset = AppUser.objects.select_related("role", "club")
        allowed_club_id = get_allowed_club_id(self.request.user)

        if allowed_club_id is not None:
            return queryset.filter(club_id=allowed_club_id)

        return queryset

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        next_is_active = request.data.get("is_active")

        if user.id == request.user.id and next_is_active in (False, "false", "False", 0, "0"):
            return Response({"message": "Nao podes desativar o teu proprio utilizador."}, status=400)

        return super().update(request, *args, **kwargs)


class AdminUserDeactivateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        user = AppUser.objects.select_related("role", "club").filter(pk=pk).first()
        if not user:
            return Response({"message": "Utilizador nao encontrado."}, status=404)

        if user.id == request.user.id:
            return Response({"message": "Nao podes desativar o teu proprio utilizador."}, status=400)

        user.is_active = False
        user.save(update_fields=["is_active"])
        record_admin_audit_action(
            action="deactivate",
            content_type="user",
            object_id=user.id,
            summary=user.email,
            actor_user=request.user,
            club_id=user.club_id,
        )
        return Response({"user": UserSerializer(user).data})


class AdminUserActivateView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]

    def post(self, request, pk):
        user = AppUser.objects.select_related("role", "club").filter(pk=pk).first()
        if not user:
            return Response({"message": "Utilizador nao encontrado."}, status=404)

        user.is_active = True
        user.save(update_fields=["is_active"])
        record_admin_audit_action(
            action="activate",
            content_type="user",
            object_id=user.id,
            summary=user.email,
            actor_user=request.user,
            club_id=user.club_id,
        )
        return Response({"user": UserSerializer(user).data})
