from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import MeasuredVariable, Sensor, Data
from .serializers import MeasuredVariableSerializer, SensorSerializer, DataSerializer
import threading
import time
import redis

# Configuración global

redis_client = redis.Redis(host='redis', port=6379, db=0)
save_time = 5

# Viewset

class MeasuredVariableViewSet(viewsets.ModelViewSet):
    queryset = MeasuredVariable.objects.all()
    serializer_class = MeasuredVariableSerializer

class SensorViewSet(viewsets.ModelViewSet):
    queryset = Sensor.objects.all()
    serializer_class = SensorSerializer

class DataViewSet(viewsets.ModelViewSet):
    queryset = Data.objects.all()
    serializer_class = DataSerializer


# guarda una lectura cada n cantidad de segundos en la db
def save_data_process():
    while True:
        Sensors = Sensor.objects.all()
        for sensor in Sensors:
            value = redis_client.get(sensor.name)
            if value:
                try:
                    float_val = float(value.decode('utf-8')) # type: ignore                    
                    Data.objects.create(sensor=sensor, value=float_val)
                except ValueError:
                    pass
        time.sleep(save_time)

threading.Thread(target=save_data_process, daemon=True).start()