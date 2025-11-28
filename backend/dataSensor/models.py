from django.db import models

class MeasuredVariable (models.Model):
    name = models.CharField(max_length=200)

class Sensor (models.Model):
    name = models.CharField(max_length=200)
    mqtt_code = models.CharField(max_length=20)
    measured_variable = models.ForeignKey(MeasuredVariable, on_delete=models.CASCADE)
    suscription_date = models.DateField(auto_created = True)
    min_range = models.FloatField()
    max_range = models.FloatField()
    hysteresis = models.FloatField(null = True, blank = True) #%
    accuracy = models.FloatField(null = True, blank = True) #%
    precision = models.FloatField(null = True, blank = True) #%

class Data (models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE)
    value = models.FloatField()
    date = models.DateTimeField(auto_now_add=True)