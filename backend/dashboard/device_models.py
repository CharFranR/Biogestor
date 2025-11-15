"""
Modelos para el registro dinámico de sensores y actuadores.

Este módulo permite registrar y gestionar dispositivos IoT de forma dinámica,
soportando n cantidad de sensores y actuadores en el sistema.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone
import json


class DeviceType(models.Model):
    """
    Tipos de dispositivos disponibles en el sistema.
    
    Define las categorías y características de dispositivos que
    pueden conectarse al biodigestor.
    """
    TYPE_CHOICES = [
        ('SENSOR', 'Sensor'),
        ('ACTUATOR', 'Actuador'),
    ]
    
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Nombre del tipo de dispositivo (ej: 'Sensor de Presión BMP180')"
    )
    category = models.CharField(
        max_length=20,
        choices=TYPE_CHOICES,
        help_text="Categoría: Sensor o Actuador"
    )
    description = models.TextField(
        blank=True,
        help_text="Descripción técnica del dispositivo"
    )
    manufacturer = models.CharField(
        max_length=100,
        blank=True,
        help_text="Fabricante del dispositivo"
    )
    model_number = models.CharField(
        max_length=50,
        blank=True,
        help_text="Número de modelo"
    )
    
    # Especificaciones técnicas (JSON)
    specs = models.JSONField(
        default=dict,
        blank=True,
        help_text="Especificaciones técnicas en formato JSON"
    )
    
    # Configuración MQTT
    mqtt_topic_pattern = models.CharField(
        max_length=255,
        blank=True,
        help_text="Patrón de topic MQTT (ej: 'sensors/{device_id}/data')"
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Tipo de Dispositivo"
        verbose_name_plural = "Tipos de Dispositivos"
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.get_category_display()}: {self.name}"


class MeasurementType(models.Model):
    """
    Tipos de mediciones que pueden realizar los sensores.
    
    Define las variables físicas o químicas que se pueden medir
    (presión, temperatura, pH, caudal, etc.)
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Nombre de la medición (ej: 'Presión Atmosférica')"
    )
    unit = models.CharField(
        max_length=20,
        help_text="Unidad de medida (ej: 'hPa', '°C', 'L/min')"
    )
    symbol = models.CharField(
        max_length=10,
        blank=True,
        help_text="Símbolo de la unidad (ej: '°C', 'Pa')"
    )
    
    # Rangos de operación normales
    min_value = models.FloatField(
        null=True,
        blank=True,
        help_text="Valor mínimo esperado"
    )
    max_value = models.FloatField(
        null=True,
        blank=True,
        help_text="Valor máximo esperado"
    )
    
    # Rangos de alerta
    warning_min = models.FloatField(
        null=True,
        blank=True,
        help_text="Umbral mínimo de advertencia"
    )
    warning_max = models.FloatField(
        null=True,
        blank=True,
        help_text="Umbral máximo de advertencia"
    )
    critical_min = models.FloatField(
        null=True,
        blank=True,
        help_text="Umbral mínimo crítico"
    )
    critical_max = models.FloatField(
        null=True,
        blank=True,
        help_text="Umbral máximo crítico"
    )
    
    description = models.TextField(
        blank=True,
        help_text="Descripción de la medición"
    )
    
    class Meta:
        verbose_name = "Tipo de Medición"
        verbose_name_plural = "Tipos de Mediciones"
        ordering = ['name']
    
    def __str__(self):
        return f"{self.name} ({self.unit})"
    
    def is_in_warning_range(self, value):
        """Verifica si el valor está en rango de advertencia."""
        if self.warning_min is not None and value < self.warning_min:
            return True
        if self.warning_max is not None and value > self.warning_max:
            return True
        return False
    
    def is_in_critical_range(self, value):
        """Verifica si el valor está en rango crítico."""
        if self.critical_min is not None and value < self.critical_min:
            return True
        if self.critical_max is not None and value > self.critical_max:
            return True
        return False


class RegisteredDevice(models.Model):
    """
    Dispositivo registrado en el sistema.
    
    Representa una instancia física de un sensor o actuador conectado
    al biodigestor. Permite gestionar múltiples dispositivos del mismo tipo.
    """
    STATUS_CHOICES = [
        ('ACTIVE', 'Activo'),
        ('INACTIVE', 'Inactivo'),
        ('MAINTENANCE', 'En Mantenimiento'),
        ('ERROR', 'Con Error'),
    ]
    
    device_type = models.ForeignKey(
        DeviceType,
        on_delete=models.PROTECT,
        related_name='instances',
        help_text="Tipo de dispositivo"
    )
    
    device_id = models.CharField(
        max_length=100,
        unique=True,
        help_text="Identificador único del dispositivo (ej: 'SENSOR_PRES_001')"
    )
    
    name = models.CharField(
        max_length=200,
        help_text="Nombre descriptivo del dispositivo"
    )
    
    location = models.CharField(
        max_length=200,
        blank=True,
        help_text="Ubicación física del dispositivo en el biodigestor"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='ACTIVE',
        help_text="Estado actual del dispositivo"
    )
    
    # Para sensores: qué mide
    measurement_types = models.ManyToManyField(
        MeasurementType,
        blank=True,
        related_name='sensors',
        help_text="Tipos de mediciones que realiza (solo para sensores)"
    )
    
    # Configuración MQTT específica
    mqtt_topic = models.CharField(
        max_length=255,
        help_text="Topic MQTT específico para este dispositivo"
    )
    
    # Configuración adicional (JSON)
    config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configuración específica del dispositivo en JSON"
    )
    
    # Información de calibración
    last_calibration = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Fecha de última calibración"
    )
    calibration_frequency_days = models.IntegerField(
        null=True,
        blank=True,
        help_text="Frecuencia de calibración recomendada (días)"
    )
    
    # Timestamps
    registered_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Fecha de registro en el sistema"
    )
    last_seen = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Última vez que el dispositivo envió datos"
    )
    
    # Metadatos
    notes = models.TextField(
        blank=True,
        help_text="Notas adicionales sobre el dispositivo"
    )
    
    class Meta:
        verbose_name = "Dispositivo Registrado"
        verbose_name_plural = "Dispositivos Registrados"
        ordering = ['-registered_at']
        indexes = [
            models.Index(fields=['device_id']),
            models.Index(fields=['status']),
            models.Index(fields=['device_type', 'status']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.device_id})"
    
    def is_online(self, threshold_minutes=10):
        """
        Verifica si el dispositivo está en línea.
        
        Un dispositivo se considera en línea si envió datos en los
        últimos threshold_minutes minutos.
        """
        if not self.last_seen:
            return False
        
        threshold = timezone.now() - timezone.timedelta(minutes=threshold_minutes)
        return self.last_seen >= threshold
    
    def needs_calibration(self):
        """
        Verifica si el dispositivo necesita calibración.
        
        Retorna True si ha pasado el tiempo recomendado desde la
        última calibración.
        """
        if not self.calibration_frequency_days or not self.last_calibration:
            return False
        
        next_calibration = self.last_calibration + timezone.timedelta(
            days=self.calibration_frequency_days
        )
        return timezone.now() >= next_calibration
    
    def update_last_seen(self):
        """Actualiza el timestamp de última comunicación."""
        self.last_seen = timezone.now()
        self.save(update_fields=['last_seen'])


class DeviceReading(models.Model):
    """
    Lectura individual de un dispositivo.
    
    Almacena cada medición realizada por un sensor con todos sus
    datos asociados. Complementa SensorReading con información
    más estructurada.
    """
    device = models.ForeignKey(
        RegisteredDevice,
        on_delete=models.CASCADE,
        related_name='readings',
        help_text="Dispositivo que generó la lectura"
    )
    
    measurement_type = models.ForeignKey(
        MeasurementType,
        on_delete=models.PROTECT,
        related_name='readings',
        help_text="Tipo de medición"
    )
    
    value = models.FloatField(
        help_text="Valor medido"
    )
    
    timestamp = models.DateTimeField(
        default=timezone.now,
        db_index=True,
        help_text="Momento de la medición"
    )
    
    quality = models.IntegerField(
        validators=[MinValueValidator(0), MaxValueValidator(100)],
        default=100,
        help_text="Calidad de la medición (0-100%)"
    )
    
    # Datos crudos originales
    raw_data = models.JSONField(
        null=True,
        blank=True,
        help_text="Datos crudos del sensor en JSON"
    )
    
    # Información de procesamiento
    processed = models.BooleanField(
        default=False,
        help_text="Indica si la lectura ha sido procesada"
    )
    
    notes = models.TextField(
        blank=True,
        help_text="Notas sobre la lectura"
    )
    
    class Meta:
        verbose_name = "Lectura de Dispositivo"
        verbose_name_plural = "Lecturas de Dispositivos"
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['device', 'timestamp']),
            models.Index(fields=['measurement_type', 'timestamp']),
            models.Index(fields=['timestamp']),
        ]
    
    def __str__(self):
        return f"{self.device.name}: {self.value} {self.measurement_type.unit} @ {self.timestamp}"
    
    def check_thresholds(self):
        """
        Verifica si la lectura excede umbrales de alerta.
        
        Retorna un diccionario con el nivel de alerta y mensaje si aplica.
        """
        result = {
            'alert_level': None,
            'message': None
        }
        
        if self.measurement_type.is_in_critical_range(self.value):
            result['alert_level'] = 'CRIT'
            if self.value < self.measurement_type.critical_min:
                result['message'] = f"{self.measurement_type.name} crítico: {self.value} {self.measurement_type.unit} (mín: {self.measurement_type.critical_min})"
            else:
                result['message'] = f"{self.measurement_type.name} crítico: {self.value} {self.measurement_type.unit} (máx: {self.measurement_type.critical_max})"
        elif self.measurement_type.is_in_warning_range(self.value):
            result['alert_level'] = 'WARN'
            if self.value < self.measurement_type.warning_min:
                result['message'] = f"{self.measurement_type.name} bajo: {self.value} {self.measurement_type.unit}"
            else:
                result['message'] = f"{self.measurement_type.name} alto: {self.value} {self.measurement_type.unit}"
        
        return result


class ActuatorAction(models.Model):
    """
    Acción ejecutada por un actuador.
    
    Registra cada comando enviado a un actuador y su resultado.
    """
    STATUS_CHOICES = [
        ('PENDING', 'Pendiente'),
        ('SENT', 'Enviado'),
        ('CONFIRMED', 'Confirmado'),
        ('FAILED', 'Fallido'),
    ]
    
    device = models.ForeignKey(
        RegisteredDevice,
        on_delete=models.CASCADE,
        related_name='actions',
        help_text="Actuador que ejecutó la acción"
    )
    
    command = models.CharField(
        max_length=100,
        help_text="Comando enviado (ej: 'OPEN', 'CLOSE', 'SET_VALUE')"
    )
    
    parameters = models.JSONField(
        default=dict,
        blank=True,
        help_text="Parámetros del comando en JSON"
    )
    
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='PENDING',
        help_text="Estado del comando"
    )
    
    requested_at = models.DateTimeField(
        auto_now_add=True,
        help_text="Momento de la solicitud"
    )
    
    executed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Momento de ejecución"
    )
    
    response = models.TextField(
        blank=True,
        help_text="Respuesta del actuador"
    )
    
    requested_by = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='actuator_actions',
        help_text="Usuario que solicitó la acción"
    )
    
    class Meta:
        verbose_name = "Acción de Actuador"
        verbose_name_plural = "Acciones de Actuadores"
        ordering = ['-requested_at']
        indexes = [
            models.Index(fields=['device', 'requested_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.device.name}: {self.command} ({self.status})"
