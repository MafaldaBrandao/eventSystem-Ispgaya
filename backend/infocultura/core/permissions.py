from rest_framework import permissions


class IsClubAdmin(permissions.BasePermission):
    allowed_roles = {'superadmin', 'club_admin'}

    def has_permission(self, request, view):
        user = request.user
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        role = getattr(user, 'role', None)
        role_name = getattr(role, 'name', None)
        return role_name in self.allowed_roles


class IsSuperAdmin(permissions.BasePermission):
    allowed_roles = {'superadmin'}

    def has_permission(self, request, view):
        user = request.user
        if not user or not getattr(user, 'is_authenticated', False):
            return False

        role = getattr(user, 'role', None)
        role_name = getattr(role, 'name', None)
        return role_name in self.allowed_roles
