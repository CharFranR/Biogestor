from django.contrib import admin

from .models import Permissions, Profile


@admin.register(Permissions)
class PermissionsAdmin(admin.ModelAdmin):
    list_display = (
        "ApproveUsers",
        "ViewReports",
        "GenerateReports",
        "ViewDashboard",
        "ViewCalibrations",
        "ViewInventory",
        "ModifyInventory",
    )


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "rol", "aprobado")
    search_fields = ("user__username", "user__email")
