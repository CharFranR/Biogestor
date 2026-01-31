from rest_framework import serializers
from .models import Fill, FillPrediction
from BatchModel.mathModel import simulation
from BatchModel.models import BasicParams

class FillPredictionSerializer (serializers.ModelSerializer):
    class Meta:
        model = FillPrediction
        fields = ('id', 'total_solids', 'total_volatile_solids', 'potencial_production', 'max_mu', 'solvent_volume', 
                  'initial_concentration', 'specific_mu', 'cumulative_production', 'derivative_production')
        
class FillSerializer(serializers.ModelSerializer):
    prediction = FillPredictionSerializer (read_only = True)
    class Meta:
        model = Fill
        fields = ('id', 'first_day', 'last_day', 'people_involved', 'filling_mass', 'approx_density', 'added_watter',
                  'type_material', 'filling_moisture', 'delay_time', 'prediction')
        
    def create(self, validated_data):

        filling_mass = validated_data['filling_mass']
        approx_density = validated_data['approx_density']
        added_watter = validated_data['added_watter']
        type_material = validated_data['type_material']
        filling_moisture = validated_data['filling_moisture']
        delay_time = validated_data['delay_time']
        temperature = 28

        # type_material es el ID del BasicParams, no el nombre
        basic_params = BasicParams.objects.get(id=int(type_material))

        simulation_data = simulation (basic_params, filling_mass, filling_moisture, temperature, 
                           added_watter, approx_density, delay_time)

        # Crear FillPrediction con todos los valores de una vez
        prediction_obj = FillPrediction.objects.create(
            total_solids=round(simulation_data[0], 3),
            total_volatile_solids=round(simulation_data[1], 3),
            potencial_production=round(simulation_data[2], 3),
            max_mu=round(simulation_data[3], 3),
            solvent_volume=round(simulation_data[4], 3),
            initial_concentration=round(simulation_data[5], 3),
            specific_mu=round(simulation_data[6], 3),
            cumulative_production=[round(x, 3) for x in simulation_data[7]],
            derivative_production=[round(x, 3) for x in simulation_data[8]]
        )

        validated_data['prediction'] = prediction_obj

        return super().create(validated_data)