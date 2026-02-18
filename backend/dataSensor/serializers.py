from rest_framework import serializers
from Fill.serializers import FillSerializer
from Fill.models import Fill
from .models import MeasuredVariable, Sensor, Data

class MeasuredVariableSerializer(serializers.ModelSerializer):
    class Meta:
        model = MeasuredVariable
        fields = ('id', 'name')

class SensorSerializer(serializers.ModelSerializer):
    measured_variable = MeasuredVariableSerializer(read_only=True)
    measured_variable_id = serializers.PrimaryKeyRelatedField(
        queryset=MeasuredVariable.objects.all(),
        source='measured_variable',
        write_only=True
    )
    
    class Meta:
        model = Sensor
        fields = ('id', 'name', 'mqtt_code', 'measured_variable', 'measured_variable_id',
                  'suscription_date', 'min_range', 'max_range', 'hysteresis', 'accuracy', 'precision')

class DataSerializer(serializers.ModelSerializer):
    sensor = SensorSerializer (read_only = True)
    fill = FillSerializer (read_only = True)
    class Meta:
        model = Data
        fields = ('id', 'sensor', 'value', 'date', 'fill')

    def create(self, validated_data):

        actual_fill = Fill.objects.filter(last_day=None).first()

        if actual_fill:
            validated_data['fill'] = actual_fill

        return super().create(validated_data)