from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import items, place
from .serializers import itemsSerializer, placeSerializer

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


def items_report (select_place):
    # Generar reportes por area del cidtea
    item = items.objects.filter(place=select_place)

    place_name = place.objects.filter(id = select_place)

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)

    c.setFont("Helvetica", 18)
    c.drawString(50, 800, "Reporte de inventario")
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, 780, f"Area: {place_name.name}")
    c.setFont("Helvetica-Bold", 14)
    c.drawString(50, 765, "Información confidencial")
    c.line(50, 760, 500, 760)

    return 0