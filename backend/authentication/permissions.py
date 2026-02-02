from rest_framework import permissions


def _user_has_permission_flag(request, flag_name: str) -> bool:
    """Return True when the authenticated user owns the requested permission flag."""
    user = getattr(request, "user", None)
    if not getattr(user, "is_authenticated", False):
        return False

    profile = getattr(user, "profile", None) or getattr(user, "perfil", None)
    if profile is None:
        return False

    permissions_obj = getattr(profile, "permissions", None) or getattr(profile, "permisos", None)
    if permissions_obj is None:
        return False

    return bool(getattr(permissions_obj, flag_name, False))


class AllowApproveUsers(permissions.BasePermission):
    """Allow users who have the ApproveUsers flag in their profile."""

    def has_permission(self, request, view):

        if request.user.is_superuser:
            return True
        return _user_has_permission_flag(request, "ApproveUsers")


class AllowViewReports(permissions.BasePermission):
    """Allow access to reporting views for users with ViewReports permission."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewReports")


class AllowGenerateReports(permissions.BasePermission):
    """Allow generating reports when the GenerateReports flag is enabled."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "GenerateReports")


class AllowViewDashboard(permissions.BasePermission):
    """Allow access to dashboard and sensor endpoints for authorized users."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewDashboard")


class AllowViewCalibrations(permissions.BasePermission):
    """Allow users with ViewCalibrations permission to access calibration resources."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewCalibrations")


class AllowViewInventory(permissions.BasePermission):
    """Allow read-only inventory endpoints to authorized users."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewInventory")


class AllowModifyInventory(permissions.BasePermission):
    """Allow create/update/delete inventory actions when ModifyInventory is enabled."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ModifyInventory")

class AllowViewFillData(permissions.BasePermission):
    """Allow view sensor data in real time"""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewFillData")