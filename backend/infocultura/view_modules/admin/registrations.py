from __future__ import annotations

from rest_framework import permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from ...api.response_builders import build_csv_response
from ...api.serializers import (
    AdminBulkStatusUpdateSerializer,
    AdminClubRegistrationSerializer,
    AdminRegistrationStatusUpdateSerializer,
)
from ...core.permissions import IsClubAdmin
from ...service_modules.audit import record_admin_audit_action
from ...service_modules.registrations import list_admin_club_registrations, update_admin_club_registration_status
from .common import get_allowed_registration_club_id
from .list_helpers import empty_admin_page_response, read_admin_list_params


class AdminRegistrationListView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsClubAdmin]

    def get(self, request):
        params = read_admin_list_params(request.query_params)
        role_name = getattr(getattr(request.user, 'role', None), 'name', None)

        if role_name == 'club_admin' and not request.user.club_id:
            return empty_admin_page_response(page=params.page, page_size=params.page_size)

        if role_name == 'club_admin':
            club_id = request.user.club_id
        else:
            club_id = params.club_id

        registration_page = list_admin_club_registrations(
            club_id=club_id,
            status=params.status,
            search=params.search,
            ordering=params.ordering,
            date_from=params.date_from,
            date_to=params.date_to,
            allowed_club_id=get_allowed_registration_club_id(request.user),
            page=params.page,
            page_size=params.page_size,
        )

        if request.query_params.get('export') == 'csv':
            export_page = list_admin_club_registrations(
                club_id=club_id,
                status=params.status,
                search=params.search,
                ordering=params.ordering,
                date_from=params.date_from,
                date_to=params.date_to,
                allowed_club_id=get_allowed_registration_club_id(request.user),
                export_all=True,
            )
            rows = [
                [
                    item.registration_id,
                    item.registration_type,
                    item.target_title,
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
                headers=['id', 'type', 'target', 'club', 'name', 'email', 'phone', 'message', 'status', 'created_at'],
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
            data={'registration_status': serializer.validated_data['status']}
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
