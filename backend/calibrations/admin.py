from django.contrib import admin
from .models import Calibration

@admin.register(Calibration)
class CalibrationAdmin (admin.ModelAdmin):
    list_display = ("sensorId",)
    search_fields = ("date",)
