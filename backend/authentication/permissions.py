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



# Sensors

class AllowViewDashboard(permissions.BasePermission):
    """Allow access to dashboard and sensor endpoints for authorized users."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewDashboard")


# Fills

class AllowViewFillData(permissions.BasePermission):
    """Allow view sensor data in real time"""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewFillData")
    
class AllowCreateFill(permissions.BasePermission):
    """Allow create fill data"""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "CreateFill")
    
class AllowEndFill(permissions.BasePermission):
    """Allow end fill data"""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "EndFill")


# Calibrations

class AllowViewCalibrations(permissions.BasePermission):
    """Allow users with ViewCalibrations permission to access calibration resources."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewCalibrations")
    
class AllowCreateCalibrations(permissions.BasePermission):
    """Allow users with CreateCalibrations permission to create calibration resources."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "CreateCalibrations")
    
class AllowModifyCalibrations(permissions.BasePermission):
    """Allow users with ModifyCalibrations permission to modify calibration resources."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ModifyCalibrations")
    
class AllowUpdateCalibrations(permissions.BasePermission):
    """Allow users with UpdateCalibrations permission to update calibration resources."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "UpdateCalibrations")

class AllowDeleteCalibrations(permissions.BasePermission):
    """Allow users with DeleteCalibrations permission to delete calibration resources."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "DeleteCalibrations")


# Inventory

class AllowViewInventory(permissions.BasePermission):
    """Allow read-only inventory endpoints to authorized users."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewInventory")
    
class AllowCreateInventory(permissions.BasePermission):
    """Allow create inventory actions when ModifyInventory is enabled."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ModifyInventory")
    
class AllowModifyInventory(permissions.BasePermission):
    """Allow create/update/delete inventory actions when ModifyInventory is enabled."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ModifyInventory")
    
class AllowUpdateInventory(permissions.BasePermission):
    """Allow update inventory actions when ModifyInventory is enabled."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ModifyInventory")

class AllowDeleteInventory(permissions.BasePermission):
    """Allow delete inventory actions when ModifyInventory is enabled."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ModifyInventory")

# Calculator
class AllowViewCalculator(permissions.BasePermission):
    """Allow access to calculator views for users with ViewCalculator permission."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewCalculator")

# Report

class AllowViewReports(permissions.BasePermission):
    """Allow access to reporting views for users with ViewReports permission."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewReports")

class AllowGenerateReports(permissions.BasePermission):
    """Allow generating reports when the GenerateReports flag is enabled."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "GenerateReports")
    

# Users

class AllowViewUsers(permissions.BasePermission):
    """Allow users who have the ViewUsers flag in their profile."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ViewUsers")
    
class AllowModifyUsers(permissions.BasePermission):
    """Allow users who have the ModifyUsers flag in their profile."""

    def has_permission(self, request, view):
        return _user_has_permission_flag(request, "ModifyUsers")

class AllowApproveUsers(permissions.BasePermission):
    """Allow users who have the ApproveUsers flag in their profile."""

    def has_permission(self, request, view):

        if request.user.is_superuser:
            return True
        return _user_has_permission_flag(request, "ApproveUsers")
    

class AllowBanUsers(permissions.BasePermission):
    """Allow users who have the BanUsers flag in their profile."""

    def has_permission(self, request, view):
        if request.user.is_superuser:
            return True
        return _user_has_permission_flag(request, "BanUsers")