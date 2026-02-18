from django.db import models

class Calibration (models.Model):
    userId = models.FloatField()  # models.ForeignKey(User, on_delete=models.CASCADE)
    sensorId = models.FloatField()
    date = models.DateField(auto_created=True)
    params = models.CharField(max_length=200)
    note = models.TextField()
    result = models.TextField()
    previous_calibration = models.DateField(null=True, blank=True)