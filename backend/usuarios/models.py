from django.db import models
from django.contrib.auth.models import User


class Permisos(models.Model):
    # Se crea una tabla de permisos pensando en la escalabilidad
    AprobarUsuarios = models.BooleanField(default=False)
    VerReportes = models.BooleanField(default=False)
    GenerarReportes = models.BooleanField(default=False)
    VerRecursos = models.BooleanField(default=False)
    SubirRecursos = models.BooleanField(default=False)
    DescargarRecursos = models.BooleanField(default=False)
    VerDashboard = models.BooleanField(default=False)
    VerInventario = models.BooleanField(default=False)
    ModificarInventario = models.BooleanField(default=False)
    InteractuarChatbot = models.BooleanField(default=False)
    VerDocumentacion = models.BooleanField(default=False)

class Instituciones(models.Model):
    Nombre = models.CharField(max_length=200)
    FechaIngreso = models.DateField()
    
    def __str__(self):
        return {self.Nombre}

class Perfil(models.Model):
    # Gracias al related_name = 'perfil' el atributo user puede accedet a su clase padre, básicamente es hacerle saber
    # el perfil en específico al que pertenece.

    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name='perfil')
    aprobado = models.BooleanField(default=False)
    permisos = models.ForeignKey(Permisos, on_delete=models.CASCADE)
    
    institucion = models.ForeignKey(Instituciones, on_delete=models.CASCADE)

    def __str__(self):
        return f'Perfil de {self.user.username} - {"Aprobado" if self.aprobado else "Pendiente"}'