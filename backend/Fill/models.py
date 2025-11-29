from django.db import models
from BatchModel.models import BasicParams

class FillPrediction (models.Model):
    total_solids = models.FloatField()
    total_volatile_solids = models.FloatField()
    potencial_production = models.FloatField()
    max_mu = models.FloatField()
    solvent_volume = models.FloatField()
    initial_concentration = models.FloatField()
    specific_mu = models.FloatField()
    cumulative_production = models.JSONField(default=list, blank=True)
    derivative_production = models.JSONField(default=list, blank=True)

class Fill (models.Model):
    first_day = models.DateField (auto_now_add = True)
    last_day = models.DateField (null = True, blank = True)
    people_involved = models.TextField(null = True, blank = True)
    filling_mass = models.FloatField()
    approx_density = models.FloatField()
    added_watter = models.FloatField()
    type_material = models.FloatField()
    filling_moisture = models.FloatField()
    delay_time = models.FloatField()
    Prediction = models.ForeignKey(FillPrediction, on_delete = models.CASCADE, null = True, blank= True)
