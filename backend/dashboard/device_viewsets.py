"""
ViewSets para el sistema de gestión de dispositivos IoT.

Proporciona endpoints REST para registro, configuración y monitoreo
de sensores y actuadores conectados al biodigestor.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from django.utils import timezone
from django.db.models import Count, Q
from datetime import timedelta

from .device_models import (
    DeviceType,
    MeasurementType,
    RegisteredDevice,
    DeviceReading,
    ActuatorAction
)
from .device_serializers import (
    DeviceTypeSerializer,
    MeasurementTypeSerializer,
    RegisteredDeviceSerializer,
    DeviceReadingSerializer,
    ActuatorActionSerializer,
    DeviceRegistrationSerializer,
    DeviceStatsSerializer
)


class DeviceTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tipos de dispositivos.
    
    Permite administrar el catálogo de tipos de sensores y actuadores
    disponibles en el sistema.
    """
    queryset = DeviceType.objects.all()
    serializer_class = DeviceTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Solo administradores pueden crear/actualizar/eliminar tipos.
        Usuarios autenticados pueden listar y ver detalles.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'])
    def sensors(self, request):
        """Lista solo tipos de sensores."""
        sensors = self.get_queryset().filter(category='SENSOR')
        serializer = self.get_serializer(sensors, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def actuators(self, request):
        """Lista solo tipos de actuadores."""
        actuators = self.get_queryset().filter(category='ACTUATOR')
        serializer = self.get_serializer(actuators, many=True)
        return Response(serializer.data)


class MeasurementTypeViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de tipos de mediciones.
    
    Define las variables físicas/químicas que pueden medir los sensores
    y sus umbrales de alerta.
    """
    queryset = MeasurementType.objects.all()
    serializer_class = MeasurementTypeSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """Solo administradores pueden modificar tipos de mediciones."""
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAdminUser()]
        return [IsAuthenticated()]


class RegisteredDeviceViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de dispositivos registrados.
    
    Permite registrar, configurar y monitorear sensores y actuadores
    físicamente conectados al biodigestor.
    
    Soporta n cantidad de dispositivos de cada tipo.
    """
    queryset = RegisteredDevice.objects.all()
    serializer_class = RegisteredDeviceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtra dispositivos según parámetros de consulta.
        
        Query params:
            status: filtrar por estado (ACTIVE, INACTIVE, MAINTENANCE, ERROR)
            category: filtrar por categoría (SENSOR, ACTUATOR)
            online: '1' o 'true' para solo dispositivos en línea
            needs_calibration: '1' o 'true' para dispositivos que necesitan calibración
        """
        queryset = super().get_queryset()
        
        # Filtrar por estado
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())
        
        # Filtrar por categoría (SENSOR o ACTUATOR)
        category = self.request.query_params.get('category')
        if category:
            queryset = queryset.filter(device_type__category=category.upper())
        
        # Filtrar solo dispositivos en línea
        online = self.request.query_params.get('online', '').lower()
        if online in ('1', 'true'):
            threshold = timezone.now() - timedelta(minutes=10)
            queryset = queryset.filter(last_seen__gte=threshold)
        
        return queryset
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def register(self, request):
        """
        Registro rápido de un nuevo dispositivo.
        
        Simplifica el proceso de alta de nuevos sensores/actuadores
        con validaciones automáticas.
        """
        serializer = DeviceRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        device = serializer.save()
        
        return Response({
            'id': device.id,
            'device_id': device.device_id,
            'message': 'Dispositivo registrado exitosamente',
            'device': RegisteredDeviceSerializer(device).data
        }, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activa un dispositivo inactivo."""
        device = self.get_object()
        device.status = 'ACTIVE'
        device.save()
        return Response({
            'message': f'Dispositivo {device.name} activado',
            'status': device.status
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Desactiva un dispositivo."""
        device = self.get_object()
        device.status = 'INACTIVE'
        device.save()
        return Response({
            'message': f'Dispositivo {device.name} desactivado',
            'status': device.status
        })
    
    @action(detail=True, methods=['post'])
    def set_maintenance(self, request, pk=None):
        """Marca un dispositivo en mantenimiento."""
        device = self.get_object()
        device.status = 'MAINTENANCE'
        device.save()
        return Response({
            'message': f'Dispositivo {device.name} en mantenimiento',
            'status': device.status
        })
    
    @action(detail=True, methods=['post'])
    def calibrate(self, request, pk=None):
        """
        Registra una calibración del dispositivo.
        
        Actualiza la fecha de última calibración y opcionalmente
        la frecuencia de calibración.
        """
        device = self.get_object()
        
        device.last_calibration = timezone.now()
        
        # Opcionalmente actualizar frecuencia de calibración
        frequency = request.data.get('frequency_days')
        if frequency:
            try:
                device.calibration_frequency_days = int(frequency)
            except ValueError:
                pass
        
        # Agregar notas de calibración
        notes = request.data.get('notes', '')
        if notes:
            device.notes = f"{device.notes}\n\nCalibración {timezone.now().date()}: {notes}".strip()
        
        device.save()
        
        return Response({
            'message': 'Calibración registrada',
            'last_calibration': device.last_calibration,
            'calibration_frequency_days': device.calibration_frequency_days
        })
    
    @action(detail=True, methods=['get'])
    def status_check(self, request, pk=None):
        """
        Verifica el estado actual del dispositivo.
        
        Retorna información detallada sobre conectividad,
        calibración y lecturas recientes.
        """
        device = self.get_object()
        
        # Última lectura
        last_reading = device.readings.order_by('-timestamp').first()
        
        return Response({
            'device_id': device.device_id,
            'name': device.name,
            'status': device.status,
            'is_online': device.is_online(),
            'last_seen': device.last_seen,
            'needs_calibration': device.needs_calibration(),
            'last_calibration': device.last_calibration,
            'last_reading': DeviceReadingSerializer(last_reading).data if last_reading else None,
            'readings_count_24h': device.readings.filter(
                timestamp__gte=timezone.now() - timedelta(days=1)
            ).count()
        })
    
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        """
        Estadísticas generales de dispositivos del sistema.
        """
        total = RegisteredDevice.objects.count()
        active = RegisteredDevice.objects.filter(status='ACTIVE').count()
        inactive = RegisteredDevice.objects.filter(status='INACTIVE').count()
        maintenance = RegisteredDevice.objects.filter(status='MAINTENANCE').count()
        error = RegisteredDevice.objects.filter(status='ERROR').count()
        
        sensors = RegisteredDevice.objects.filter(device_type__category='SENSOR').count()
        actuators = RegisteredDevice.objects.filter(device_type__category='ACTUATOR').count()
        
        # Dispositivos en línea (últimos 10 minutos)
        threshold = timezone.now() - timedelta(minutes=10)
        online = RegisteredDevice.objects.filter(last_seen__gte=threshold).count()
        
        # Dispositivos que necesitan calibración
        needs_calib = sum(1 for d in RegisteredDevice.objects.all() if d.needs_calibration())
        
        # Lecturas hoy
        today = timezone.now().date()
        readings_today = DeviceReading.objects.filter(timestamp__date=today).count()
        
        # Acciones hoy
        actions_today = ActuatorAction.objects.filter(requested_at__date=today).count()
        
        stats = {
            'total_devices': total,
            'active_devices': active,
            'inactive_devices': inactive,
            'maintenance_devices': maintenance,
            'error_devices': error,
            'sensors_count': sensors,
            'actuators_count': actuators,
            'online_devices': online,
            'needs_calibration_count': needs_calib,
            'readings_today': readings_today,
            'actions_today': actions_today,
        }
        
        serializer = DeviceStatsSerializer(stats)
        return Response(serializer.data)


class DeviceReadingViewSet(viewsets.ModelViewSet):
    """
    ViewSet para lecturas de dispositivos.
    
    Proporciona acceso a todas las mediciones realizadas por sensores,
    con opciones de filtrado y análisis.
    """
    queryset = DeviceReading.objects.all()
    serializer_class = DeviceReadingSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtra lecturas según parámetros de consulta.
        
        Query params:
            device_id: ID del dispositivo
            measurement_type_id: ID del tipo de medición
            start_date: fecha inicio (YYYY-MM-DD)
            end_date: fecha fin (YYYY-MM-DD)
            alerts_only: '1' o 'true' para solo lecturas con alertas
        """
        queryset = super().get_queryset()
        
        # Filtrar por dispositivo
        device_id = self.request.query_params.get('device_id')
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        # Filtrar por tipo de medición
        measurement_type_id = self.request.query_params.get('measurement_type_id')
        if measurement_type_id:
            queryset = queryset.filter(measurement_type_id=measurement_type_id)
        
        # Filtrar por rango de fechas
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(timestamp__date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(timestamp__date__lte=end_date)
        
        return queryset
    
    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Últimas 100 lecturas del sistema."""
        recent_readings = self.get_queryset()[:100]
        serializer = self.get_serializer(recent_readings, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def alerts(self, request):
        """
        Lecturas que generaron alertas.
        
        Filtra lecturas que exceden umbrales de advertencia o críticos.
        """
        readings = []
        for reading in self.get_queryset()[:500]:  # Últimas 500 lecturas
            alert_info = reading.check_thresholds()
            if alert_info['alert_level']:
                data = self.get_serializer(reading).data
                data['alert_info'] = alert_info
                readings.append(data)
        
        return Response(readings)


class ActuatorActionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para acciones de actuadores.
    
    Gestiona comandos enviados a actuadores y su seguimiento.
    """
    queryset = ActuatorAction.objects.all()
    serializer_class = ActuatorActionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtra acciones según parámetros.
        
        Query params:
            device_id: ID del dispositivo
            status: estado del comando (PENDING, SENT, CONFIRMED, FAILED)
            start_date: fecha inicio
            end_date: fecha fin
        """
        queryset = super().get_queryset()
        
        device_id = self.request.query_params.get('device_id')
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param.upper())
        
        start_date = self.request.query_params.get('start_date')
        if start_date:
            queryset = queryset.filter(requested_at__date__gte=start_date)
        
        end_date = self.request.query_params.get('end_date')
        if end_date:
            queryset = queryset.filter(requested_at__date__lte=end_date)
        
        return queryset
    
    def perform_create(self, serializer):
        """Asocia el usuario que solicitó la acción."""
        serializer.save(requested_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def confirm(self, request, pk=None):
        """Marca una acción como confirmada."""
        action = self.get_object()
        action.status = 'CONFIRMED'
        action.executed_at = timezone.now()
        action.response = request.data.get('response', '')
        action.save()
        
        return Response({
            'message': 'Acción confirmada',
            'status': action.status
        })
    
    @action(detail=True, methods=['post'])
    def fail(self, request, pk=None):
        """Marca una acción como fallida."""
        action = self.get_object()
        action.status = 'FAILED'
        action.response = request.data.get('response', 'Error no especificado')
        action.save()
        
        return Response({
            'message': 'Acción marcada como fallida',
            'status': action.status
        })
    
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """Lista acciones pendientes de ejecutar."""
        pending = self.get_queryset().filter(status='PENDING')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)
