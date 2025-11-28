from django.shortcuts import render
from rest_framework import viewsets
from .models import MeasuredVariable, Sensor
from .serializers import MeasuredVariableSerializer, SensorSerializer

class MeasuredVariableViewSet(viewsets.ModelViewSet):
    queryset = MeasuredVariable.objects.all()
    serializer_class = MeasuredVariableSerializer
