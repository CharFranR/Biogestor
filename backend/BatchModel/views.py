from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import BasicParams
from .serializers import BasicParamsSerializer, BatchModelSerializer
from .mathModel import simulation

class BasicParamsViewSet(viewsets.ModelViewSet):
    queryset = BasicParams.objects.all()
    serializer_class = BasicParamsSerializer

class mathModelAPI (APIView):
    def post (self, request, format=None):

        filling_mass = request.data['filling_mass']
        approx_density = request.data['approx_density']
        added_watter = request.data['added_watter']
        type_material = request.data['type_material']
        filling_moisture = request.data['filling_moisture']
        delay_time = request.data['delay_time']
        temperature = request.data['temperature']

        basic_params = BasicParams.objects.get(supplyName = type_material)

        data = simulation (basic_params, filling_mass, filling_moisture, temperature, 
                           added_watter, approx_density, delay_time)
        
        data_dict = {
            "total_solids": data[0],
            "total_volatile_solids": data[1],
            "potencial_production": data[2],
            "max_mu": data[3],
            "solvent_volume": data[4],
            "initial_concentration": data[5],
            "specific_mu": data[6],
            "cumulative_production": data[7],
        }

        serializer = BatchModelSerializer(data_dict)

        return Response(serializer.data)