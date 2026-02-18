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
        temperature = request.data.get('temperature', 35)  # Default temperature

        # Search by ID if numeric, otherwise by name
        if isinstance(type_material, int) or (isinstance(type_material, str) and type_material.isdigit()):
            basic_params = BasicParams.objects.get(id=int(type_material))
        else:
            basic_params = BasicParams.objects.get(supplyName=type_material)

        data = simulation (basic_params, filling_mass, filling_moisture, temperature, 
                           added_watter, approx_density, delay_time)
        
        data_dict = {
            "total_solids": round(data[0],3),                               # type: ignore
            "total_volatile_solids": round(data[1],3),                      # type: ignore
            "potencial_production": round(data[2],3),                       # type: ignore
            "max_mu": round(data[3],3),                                     # type: ignore
            "solvent_volume": round(data[4],3),                             # type: ignore
            "initial_concentration": round(data[5],3),                      # type: ignore
            "specific_mu": round(data[6],3),                                # type: ignore
            "cumulative_production": [round(x, 3) for x in data[7]],        # type: ignore
            "derivative_production": [round(x, 3) for x in data[8]],        # type: ignore
        }

        serializer = BatchModelSerializer(data_dict)

        return Response(serializer.data)