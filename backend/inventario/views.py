from rest_framework import generics, status, viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import items
from .serializers import itemsSerializer

class itemsViewSet(viewsets.ModelViewSet):
    queryset = items.objects.all()
    serializer_class = itemsSerializer