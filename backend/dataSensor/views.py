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


# Ejecuta una iteración de guardado (testable)
def save_data_iteration():
    Sensors = Sensor.objects.all()
    for sensor in Sensors:
        key = f"Biogestor/{sensor.mqtt_code}"
        last_value = redis_client.lindex(key, -1)
        if last_value:
            try:
                float_val = float(last_value.decode('utf-8'))  # type: ignore
                Data.objects.create(sensor=sensor, value=float_val)
            except ValueError:
                pass

# Guarda una lectura cada n segundos en la DB (hilo)
def save_data_process():
    while True:
        save_data_iteration()
        time.sleep(save_time)

# Inicio explícito del hilo (no auto en import para facilitar tests)
def start_save_data_thread():
    for t in threading.enumerate():
        if t.name == "dataSensor-save-thread":
            return t
    t = threading.Thread(target=save_data_process, daemon=True, name="dataSensor-save-thread")
    t.start()
    return t