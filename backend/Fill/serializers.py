from rest_framework import serializers
from .models import Fill, FillPrediction

class FillPredictionSerializer (serializers.ModelSerializer):
    class Meta:
        model = FillPrediction
        fields = ('id', 'total_solids', 'total_volatile_solids', 'potencial_production', 'max_mu', 'solvent_volume', 
                  'initial_concentration', 'specific_mu', 'cumulative_production', 'derivative_production')
        
class FillSerializer(serializers.ModelSerializer):
    Prediction = FillPredictionSerializer (read_only = True)
    class Meta:
        model = Fill
        fields = ('id', 'first_day', 'last_day', 'people_involved', 'filling_mass', 'approx_density', 'added_watter',
                  'type_material', 'filling_moisture', 'delay_time', 'prediction')