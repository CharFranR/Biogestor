from rest_framework import serializers
from .models import MeasuredVariable, Sensor, Data

class MeasuredVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasuredVariable
        fields = ('id', 'name')

class SensorSerializer(serializers.ModelSerializer):
    measured_variable = MeasuredVariableSerializer (read_only = True)
    class Meta:
        model = Sensor
        fields = ('id', 'name', 'mqtt_code', 'measured_variable', 'suscription_date', 
                  'min_range', 'max_range', 'hysteresis', 'accuracy', 'precision')

class DataSerializer(serializers.ModelSerializer):
    sensor = SensorSerializer (read_only = True)
    class Meta:
        model = Data
        fields = ('id', 'sensor', 'value', 'date')