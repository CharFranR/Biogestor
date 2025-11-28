from django.contrib import admin
from .models import MeasuredVariable, Sensor, Data

admin.site.register(MeasuredVariable)
admin.site.register(Sensor)
admin.site.register(Data)
