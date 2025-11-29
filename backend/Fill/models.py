from django.db import models
from BatchModel.models import BasicParams

# Create your models here.
class Fill (models.Model):
    first_day = models.DateField (auto_now_add = True)
    last_day = models.DateField (null = True, blank = True)
    supply_params = models.ForeignKey(BasicParams, on_delete=models.CASCADE)
    people_involved = models.TextField(null = True, blank = True)