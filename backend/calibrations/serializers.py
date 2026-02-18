from rest_framework import  serializers
from .models import Calibration

class CalibrationSerializer (serializers.ModelSerializer):
    class Meta:
        model = Calibration
        fields = ('id', 'userId', 'sensorId', 'date', 'params', 'note', 'result', 'previous_calibration')

    def create(self, validated_data):
        last_calibration = Calibration.objects.filter(sensorId=validated_data['sensorId']).order_by('-date').first()
        previous_calibration = last_calibration.date if last_calibration else None
        validated_data['previous_calibration'] = previous_calibration
        return super().create(validated_data) 