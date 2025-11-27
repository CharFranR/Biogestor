from rest_framework import serializers
from .models import BasicParams

class BasicParamsSerializer(serializers.ModelSerializer):
    model = BasicParams
    field = ['id', 'supplyName', 'TS', 'VSTS', 'potencial_production']