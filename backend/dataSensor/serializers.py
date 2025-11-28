from rest_framework import serializers
from .models import MeasuredVariable, Sensor, Data

class MeasuredVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasuredVariable
        fields = ('id', 'name')

class SensorSerializer(serializers.ModelSerializer):
    measured_variable = MeasuredVariableSerializer (read_onlye = True)
    class Meta:
        model = Sensor
        field = ('id', 'measured_variable', 'suscription_date', 
                 'min_range', 'max_range', 'hysteresis', 'accuracy', 'precision')

class DataSerializer(serializers.ModelSerializer):
    class Meta:
        model = Data
        fields = ('id', 'sensor', 'value', 'date')