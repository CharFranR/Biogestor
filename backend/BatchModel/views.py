from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import BasicParams
from .serializers import BasicParamsSerializer, BathModelSerializer
from .mathModel import simulation

class BasicParamsViewSet(viewsets.ModelViewSet):
    queryset = BasicParams.objects.all()
    serializer_class = BasicParamsSerializer

class mathModelAPI (APIView):
    def calculate (self, request, format=None):

        filling_mass = request.filling_mass
        approx_density = request.approx_density
        added_watter = request.added_watter
        type_material = request.type_material
        filling_moisture = request.filling_moisture
        delay_time = request.delay_time
        date_period = request.date_period
        temperature = request.temperature

        basic_params = BasicParams.objects.get(supplyName = type_material)

        data = simulation (basic_params, filling_mass, filling_moisture, temperature, 
                           added_watter, approx_density, delay_time, date_period)
        
        serializer = BathModelSerializer(data)

        return (serializer.data)