from django.shortcuts import render
from rest_framework import viewsets

from .models import BasicParams
from .serializers import BasicParamsSerializer

class BasicParamsViewSet(viewsets.ModelViewSet):
    queryset = BasicParams.objects.all()
    serializer_class = BasicParamsSerializer