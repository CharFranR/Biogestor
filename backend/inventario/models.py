from django.db import models

class place (models.Model):
    name = models.CharField(max_length=200)

class items (models.Model):
    # Se registran los items en el inventario guardando el nombre, la cantidad del mismo y el area
    # del cidtea a la cual pertenece.
    name = models.CharField(max_length=200)
    measurement = models.CharField(max_length=200)
    quantity = models.IntegerField()
    place = models.ForeignKey(place, on_delete=models.CASCADE)
    description = models.CharField(max_length=200, blank=True, null=True)