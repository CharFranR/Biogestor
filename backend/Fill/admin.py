from django.contrib import admin

from .models import Fill, FillPrediction


@admin.register(FillPrediction)
class FillPredictionAdmin(admin.ModelAdmin):
    list_display = (
        "total_solids",
        "total_volatile_solids",
        "potencial_production",
        "max_mu",
        "solvent_volume",
        "initial_concentration",
        "specific_mu",
    )


@admin.register(Fill)
class FillAdmin(admin.ModelAdmin):
    list_display = (
        "first_day",
        "last_day",
        "filling_mass",
        "approx_density",
        "added_watter",
        "type_material",
        "filling_moisture",
        "delay_time",
    )
