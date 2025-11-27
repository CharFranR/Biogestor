from rest_framework import serializers
from .models import BasicParams

class BasicParamsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BasicParams
        fields = ['id', 'supplyName', 'TS', 'VSTS', 'potencial_production']

class BatchModelSerializer(serializers.Serializer):
    total_solids = serializers.FloatField()
    total_volatile_solids = serializers.FloatField()
    potencial_production = serializers.FloatField()
    max_mu = serializers.FloatField()
    solvent_volume = serializers.FloatField()
    initial_concentration = serializers.FloatField()
    specific_mu = serializers.FloatField()
    cumulative_production = serializers.ListField(child=serializers.FloatField())
    derivative_production = serializers.ListField(child=serializers.FloatField())