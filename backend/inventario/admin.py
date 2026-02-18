from django.contrib import admin
from .models import place, items
from .views import items_report

# Register your models here.
from django.http import HttpResponse

def generate_report(modeladmin, request, queryset):
    # Solo genera el reporte para el primer lugar seleccionado
    if queryset.exists():
        buffer = items_report(queryset.first().id)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="reporte_inventario.pdf"'
        return response
    else:
        return HttpResponse("No se seleccionó ningún lugar.")

@admin.register(place)
class placeAdmin(admin.ModelAdmin):
    list_display = ("name",)
    search_fields = ("name",)
    actions = [generate_report]

@admin.register(items)
class itemsAdmin(admin.ModelAdmin):
    list_display = ("name", "quantity", "place")
    search_fields = ("name", "place")
