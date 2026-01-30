from django.contrib import admin

from .models import Data, MeasuredVariable, Sensor


@admin.register(MeasuredVariable)
class MeasuredVariableAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)


@admin.register(Sensor)
class SensorAdmin(admin.ModelAdmin):
    list_display = ("name", "mqtt_code", "measured_variable", "min_range", "max_range")
    search_fields = ("name", "mqtt_code")


@admin.register(Data)
class DataAdmin(admin.ModelAdmin):
    list_display = ("sensor", "value", "date")
    search_fields = ("sensor__name",)
