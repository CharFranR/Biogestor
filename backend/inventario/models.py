from django.db import models

class items (models.Model):
    # Se registran los items en el inventario guardando el nombre, la cantidad del mismo y el area
    # del cidtea a la cual pertenece.
    name = models.CharField(max_length=200)
    quantity = models.IntegerField()
    area = models.CharField(max_length=200)