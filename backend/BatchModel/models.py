from django.db import models

class BasicParams(models.Model):
    supplyName = models.CharField(max_length=200)
    TS = models.FloatField()
    VSTS = models.FloatField()
    potencial_production= models.FloatField()  #m³/kg VS