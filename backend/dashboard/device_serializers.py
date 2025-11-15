"""
Serializers para el sistema de gestión de dispositivos.

Proporciona serialización REST para los modelos de dispositivos IoT.
"""

from rest_framework import serializers
from .device_models import (
    DeviceType,
    MeasurementType,
    RegisteredDevice,
    DeviceReading,
    ActuatorAction
)


class DeviceTypeSerializer(serializers.ModelSerializer):
    """Serializer para tipos de dispositivos."""
    
    instances_count = serializers.IntegerField(
        source='instances.count',
        read_only=True
    )
    
    class Meta:
        model = DeviceType
        fields = [
            'id', 'name', 'category', 'description', 'manufacturer',
            'model_number', 'specs', 'mqtt_topic_pattern',
            'created_at', 'updated_at', 'instances_count'
        ]
        read_only_fields = ['created_at', 'updated_at']


class MeasurementTypeSerializer(serializers.ModelSerializer):
    """Serializer para tipos de mediciones."""
    
    class Meta:
        model = MeasurementType
        fields = [
            'id', 'name', 'unit', 'symbol',
            'min_value', 'max_value',
            'warning_min', 'warning_max',
            'critical_min', 'critical_max',
            'description'
        ]


class RegisteredDeviceSerializer(serializers.ModelSerializer):
    """Serializer para dispositivos registrados."""
    
    device_type_name = serializers.CharField(
        source='device_type.name',
        read_only=True
    )
    device_category = serializers.CharField(
        source='device_type.category',
        read_only=True
    )
    is_online = serializers.SerializerMethodField()
    needs_calibration = serializers.SerializerMethodField()
    measurement_types_data = MeasurementTypeSerializer(
        source='measurement_types',
        many=True,
        read_only=True
    )
    
    class Meta:
        model = RegisteredDevice
        fields = [
            'id', 'device_type', 'device_type_name', 'device_category',
            'device_id', 'name', 'location', 'status',
            'measurement_types', 'measurement_types_data',
            'mqtt_topic', 'config',
            'last_calibration', 'calibration_frequency_days',
            'registered_at', 'last_seen',
            'is_online', 'needs_calibration',
            'notes'
        ]
        read_only_fields = ['registered_at', 'last_seen']
    
    def get_is_online(self, obj):
        """Indica si el dispositivo está en línea."""
        return obj.is_online()
    
    def get_needs_calibration(self, obj):
        """Indica si el dispositivo necesita calibración."""
        return obj.needs_calibration()


class DeviceReadingSerializer(serializers.ModelSerializer):
    """Serializer para lecturas de dispositivos."""
    
    device_name = serializers.CharField(
        source='device.name',
        read_only=True
    )
    device_id_str = serializers.CharField(
        source='device.device_id',
        read_only=True
    )
    measurement_name = serializers.CharField(
        source='measurement_type.name',
        read_only=True
    )
    measurement_unit = serializers.CharField(
        source='measurement_type.unit',
        read_only=True
    )
    alert_info = serializers.SerializerMethodField()
    
    class Meta:
        model = DeviceReading
        fields = [
            'id', 'device', 'device_name', 'device_id_str',
            'measurement_type', 'measurement_name', 'measurement_unit',
            'value', 'timestamp', 'quality',
            'raw_data', 'processed', 'notes',
            'alert_info'
        ]
        read_only_fields = ['timestamp']
    
    def get_alert_info(self, obj):
        """Información de alertas para la lectura."""
        return obj.check_thresholds()


class ActuatorActionSerializer(serializers.ModelSerializer):
    """Serializer para acciones de actuadores."""
    
    device_name = serializers.CharField(
        source='device.name',
        read_only=True
    )
    requested_by_username = serializers.CharField(
        source='requested_by.username',
        read_only=True
    )
    
    class Meta:
        model = ActuatorAction
        fields = [
            'id', 'device', 'device_name',
            'command', 'parameters', 'status',
            'requested_at', 'executed_at', 'response',
            'requested_by', 'requested_by_username'
        ]
        read_only_fields = ['requested_at', 'executed_at']


class DeviceRegistrationSerializer(serializers.Serializer):
    """
    Serializer para registro rápido de nuevos dispositivos.
    
    Simplifica el proceso de registro proporcionando campos esenciales.
    """
    device_type_id = serializers.IntegerField(
        help_text="ID del tipo de dispositivo"
    )
    device_id = serializers.CharField(
        max_length=100,
        help_text="Identificador único del dispositivo"
    )
    name = serializers.CharField(
        max_length=200,
        help_text="Nombre descriptivo"
    )
    location = serializers.CharField(
        max_length=200,
        required=False,
        allow_blank=True,
        help_text="Ubicación física"
    )
    mqtt_topic = serializers.CharField(
        max_length=255,
        help_text="Topic MQTT"
    )
    measurement_type_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=False,
        help_text="IDs de tipos de mediciones (para sensores)"
    )
    config = serializers.JSONField(
        required=False,
        help_text="Configuración adicional"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Notas adicionales"
    )
    
    def validate_device_type_id(self, value):
        """Valida que el tipo de dispositivo exista."""
        try:
            DeviceType.objects.get(id=value)
        except DeviceType.DoesNotExist:
            raise serializers.ValidationError("Tipo de dispositivo no encontrado")
        return value
    
    def validate_device_id(self, value):
        """Valida que el device_id sea único."""
        if RegisteredDevice.objects.filter(device_id=value).exists():
            raise serializers.ValidationError(
                "Ya existe un dispositivo con este ID"
            )
        return value
    
    def create(self, validated_data):
        """Crea un nuevo dispositivo registrado."""
        measurement_type_ids = validated_data.pop('measurement_type_ids', [])
        
        device = RegisteredDevice.objects.create(**validated_data)
        
        if measurement_type_ids:
            device.measurement_types.set(measurement_type_ids)
        
        return device


class DeviceStatsSerializer(serializers.Serializer):
    """Serializer para estadísticas de dispositivos."""
    
    total_devices = serializers.IntegerField()
    active_devices = serializers.IntegerField()
    inactive_devices = serializers.IntegerField()
    maintenance_devices = serializers.IntegerField()
    error_devices = serializers.IntegerField()
    sensors_count = serializers.IntegerField()
    actuators_count = serializers.IntegerField()
    online_devices = serializers.IntegerField()
    needs_calibration_count = serializers.IntegerField()
    readings_today = serializers.IntegerField()
    actions_today = serializers.IntegerField()
