from django.conf import settings
from django.db import models

class Permissions(models.Model):

    # Sensors
    ViewDashboard = models.BooleanField(default=False)
    
    # Fills
    ViewFillData = models.BooleanField(default=False)
    CreateFill = models.BooleanField(default=False)
    EndFill = models.BooleanField(default=False)

    # Calibrations
    ViewCalibrations = models.BooleanField(default=False)
    CreateCalibrations = models.BooleanField(default=False)
    ModifyCalibrations = models.BooleanField(default=False)
    UpdateCalibrations = models.BooleanField(default=False)
    DeleteCalibrations = models.BooleanField(default=False)

    # Inventory
    ViewInventory = models.BooleanField(default=False)
    CreateInventory = models.BooleanField(default=False)
    ModifyInventory = models.BooleanField(default=False)
    UpdateInventory = models.BooleanField(default=False)
    DeleteInventory = models.BooleanField(default=False)

    # Calculator
    ViewCalculator = models.BooleanField(default=False)
    
    # Reports
    ViewReports = models.BooleanField(default=False)
    GenerateReports = models.BooleanField(default=False)

    # Usuarios
    ViewUsers = models.BooleanField(default=False)
    ModifyUsers = models.BooleanField(default=False)
    ApproveUsers = models.BooleanField(default=False)
    BanUsers = models.BooleanField(default=False)

    
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
