from django.contrib import admin

from .models import BasicParams


@admin.register(BasicParams)
class BasicParamsAdmin(admin.ModelAdmin):
    list_display = ("supplyName", "TS", "VSTS", "potencial_production")
    search_fields = ("supplyName",)
