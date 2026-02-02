from django.conf import settings
from django.db import models

class Permissions(models.Model):
    # Users
    ApproveUsers = models.BooleanField(default=False)

    # Reports
    ViewReports = models.BooleanField(default=False)
    GenerateReports = models.BooleanField(default=False)

    # Dashboard and Sensors
    ViewDashboard = models.BooleanField(default=False)
    ViewFillData = models.BooleanField(default=False)

    # Calibrations
    ViewCalibrations = models.BooleanField(default=False)

    # Inventory
    ViewInventory = models.BooleanField(default=False)
    ModifyInventory = models.BooleanField(default=False)
    
class Profile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    
    ROLE_CHOICES = [
        ("ADMIN", "Administrador"),
        ("COLAB", "Colaborador"),
        ("VISIT", "Visitante"),
    ]
    aprobado = models.BooleanField(default=False)
    rol = models.CharField(max_length=10, choices=ROLE_CHOICES, default="VISIT")

    permissions = models.ForeignKey(Permissions, on_delete=models.CASCADE)
