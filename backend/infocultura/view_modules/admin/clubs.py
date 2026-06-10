from __future__ import annotations

from django.db import DatabaseError
from django.db.models import Q
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.response_builders import build_csv_response, paginate_queryset
from ...api.serializers import ClubMemberAssignSerializer, ClubSerializer, UserSerializer
from ...core.permissions import IsSuperAdmin
from ...models import AppUser, Club
from ...service_modules.audit import record_admin_audit_action
from .common import AdminAuditDestroyMixin, AdminAuditMixin
from .list_helpers import read_admin_list_params


class AdminClubListCreateView(AdminAuditMixin, generics.ListCreateAPIView):
    serializer_class = ClubSerializer
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin]
    audit_content_type = 'club'

    def get_queryset(self):
        queryset = Club.objects.all()
        params = read_admin_list_params(self.request.query_params)

        if params.search:
            queryset = queryset.filter(
                Q(name__icontains=params.search)
                | Q(description__icontains=params.search)
                | Q(mission__icontains=params.search)
            )

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
        member_count = AppUser.objects.filter(club=club).count()
        if member_count:
            return Response(
                {
                    'message': (
                        f'Nao podes apagar o clube "{club.name}" porque tem '
                        f'{member_count} utilizador(es) associado(s). Remove primeiro esses utilizadores do clube.'
                    )
                },
                status=status.HTTP_409_CONFLICT,
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

    def post(self, request, pk, user_pk=None):
        club = Club.objects.filter(pk=pk).first()
        if not club:
            return Response({'message': 'Clube nao encontrado.'}, status=404)

        serializer = ClubMemberAssignSerializer(data=request.data or {'user_id': user_pk})
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

        AppUser.objects.filter(pk=user.pk, club_id=club.id).update(club_id=None)
        user.club_id = None
        user.club = None
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

    def post(self, request, pk, user_pk):
        return self.delete(request, pk, user_pk)
