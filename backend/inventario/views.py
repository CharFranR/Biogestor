from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import items, place
from .serializers import itemsSerializer, placeSerializer
from rest_framework.decorators import action
from django.utils import timezone
from django.http import HttpResponse


from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
import os, tempfile


class itemsViewSet(viewsets.ModelViewSet):
    queryset = items.objects.all()
    serializer_class = itemsSerializer

class placesViewSet(viewsets.ModelViewSet):
    queryset = place.objects.all()
    serializer_class = placeSerializer

    @action(detail=True, methods=['post'])
    def generate_report(self, request, pk=None):
        
        date = timezone.now()

        try:
            buffer = items_report(pk)
            response = HttpResponse(buffer, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename="reporte_inventario.pdf"'
            return response

        except Exception as e:
            return Response ({"error": str(e)}, status=500)

def items_report (select_place):
    # Generar reportes por area del cidtea
    item = items.objects.filter(place=select_place)
    place_name = place.objects.filter(id=select_place).first()

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)

    # Encabezado principal
    c.setFont("Helvetica-Bold", 20)
    c.drawString(50, 800, "Reporte de Inventario")
    c.setFont("Helvetica", 12)
    from datetime import datetime
    c.drawString(400, 800, f"Fecha: {datetime.now().strftime('%d/%m/%Y %H:%M')}")
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 780, f"Área: {place_name.name if place_name else 'Desconocido'}")
    c.setFont("Helvetica", 12)
    c.drawString(50, 765, "Información confidencial")
    c.line(50, 760, 500, 760)

    # Tabla de items
    y = 740
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Nombre")
    c.drawString(250, y, "Cantidad")
    c.drawString(350, y, "Ubicación")
    y -= 20
    c.line(50, y + 12, 500, y + 12)

    c.setFont("Helvetica", 12)
    total = 0
    for i in item:
        c.drawString(50, y, f"{i.name}")
        c.drawString(250, y, f"{i.quantity}")
        c.drawString(350, y, f"{i.place.name if i.place else '-'}")
        total += i.quantity if hasattr(i, 'quantity') and isinstance(i.quantity, (int, float)) else 0
        y -= 18
        if y < 60:
            c.showPage()
            y = 800

    # Total de cantidades
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y-10, f"Total de cantidad: {total}")

    # Pie de página
    c.setFont("Helvetica-Oblique", 10)
    c.drawString(50, 40, "Reporte generado automáticamente por Biogestor")

    c.save()
    buffer.seek(0)
    return buffer