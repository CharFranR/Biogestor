"""
ViewSets para el módulo dashboard.

Este módulo proporciona ViewSets basados en REST framework para manejar
operaciones CRUD en los modelos relacionados con el dashboard de biodigestión.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import FormParser, MultiPartParser
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.http import FileResponse, HttpResponse
from django.db.models import Q
import pandas as pd
import io
from datetime import datetime, timedelta

from .models import (
    FillingStage, 
    SensorReading, 
    Report, 
    ActuatorCommand, 
    Alert, 
    CalibrationRecord,
    PracticeSession
)
from .serializers import (
    FillingStageSerializer,
    SensorReadingSerializer,
    ReportSerializer,
    ActuatorCommandSerializer,
    AlertSerializer,
    CalibrationRecordSerializer,
    PracticeSessionSerializer
)
from usuarios.permisos import PuedeVerCalibraciones, PuedeVerDashboard
from biocalculadora.calculators import estimate_timeseries_for_material


class FillingStageViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestionar las etapas de llenado del biodigestor.
    
    Proporciona operaciones CRUD estándar más acciones personalizadas:
    - list: Lista todas las etapas de llenado
    - create: Crea una nueva etapa de llenado
    - retrieve: Obtiene detalles de una etapa específica
    - update: Actualiza una etapa existente
    - partial_update: Actualización parcial de una etapa
    - destroy: Elimina una etapa
    - close_current: Cierra la etapa activa actual
    """
    queryset = FillingStage.objects.all().order_by('-active', '-created_at')
    serializer_class = FillingStageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Personaliza permisos por acción.
        - create: permite usuarios no autenticados para facilitar registro
        - otros: requieren autenticación
        """
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    def create(self, request, *args, **kwargs):
        """
        Crea una nueva etapa de llenado.
        
        Aplica valores por defecto si no se proporcionan:
        - number: siguiente número correlativo
        - people: 'Sin especificar' si está vacío
        - date: fecha actual si no se proporciona
        """
        data = request.data.copy()
        
        # Asignar número correlativo si no se proporciona
        try:
            num = int(data.get('number')) if data.get('number') not in [None, "", []] else None
        except Exception:
            num = None
        
        if not num or num <= 0:
            last = FillingStage.objects.order_by('-number').first()
            data['number'] = (last.number + 1) if last and last.number is not None else 1
        
        # Valor por defecto para personas
        if not data.get('people'):
            data['people'] = 'Sin especificar'
        
        # Fecha por defecto
        if not data.get('date'):
            data['date'] = datetime.now().date().isoformat()
        
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        filling = serializer.save()
        
        return Response({
            "id": filling.id,
            "detail": "Llenado registrado correctamente."
        }, status=status.HTTP_201_CREATED)
    
    def list(self, request, *args, **kwargs):
        """
        Lista las etapas de llenado, priorizando la activa.
        
        Retorna las últimas 50 etapas ordenadas por:
        1. Estado activo (primero)
        2. Fecha de creación (más reciente primero)
        """
        queryset = self.get_queryset()[:50]
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            "results": serializer.data,
            "count": queryset.count()
        })
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def close_current(self, request):
        """
        Cierra la etapa activa actual.
        
        Returns:
            Response con detalles de la etapa cerrada o 404 si no hay activa
        """
        stage = FillingStage.objects.filter(active=True).order_by('-created_at').first()
        if stage is None:
            return Response(
                {"detail": "No hay etapa activa para cerrar."},
                status=status.HTTP_404_NOT_FOUND
            )
        
        stage.active = False
        stage.save()
        
        return Response({
            "detail": f"Etapa #{stage.number} cerrada.",
            "stage_id": stage.id
        })
    
    @action(detail=True, methods=['get'])
    def production(self, request, pk=None):
        """
        Obtiene datos de producción para una etapa específica.
        
        Calcula series esperadas vs reales de producción de biogás.
        """
        stage = self.get_object()
        
        # Calcular serie esperada
        series = estimate_timeseries_for_material(
            material_type=stage.material_type,
            vs_kg_per_day=stage.material_amount_kg,
            reactor_volume_m3=None,
            temperature_c=stage.temperature_c,
        )
        
        # Calcular serie real desde las lecturas
        start_time = stage.created_at
        end_time = timezone.now()
        readings = SensorReading.objects.filter(
            stage=stage,
            timestamp__gte=start_time,
            timestamp__lte=end_time
        ).order_by('timestamp')
        
        # Procesar lecturas para obtener producción diaria
        daily_map = {}
        last_total_gas = None
        last_ts = None
        
        for r in readings:
            ts = r.timestamp
            payload = r.raw_payload or {}
            delta = 0.0
            
            # Estrategia 1: usar acumulado total si está disponible
            if isinstance(payload, dict) and 'gas_total_m3' in payload:
                try:
                    total = float(payload.get('gas_total_m3') or 0.0)
                    if last_total_gas is not None:
                        delta = max(0.0, total - last_total_gas)
                    last_total_gas = total
                except Exception:
                    pass
            # Estrategia 2: calcular desde caudal
            elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload):
                try:
                    if 'caudal_gas' in payload:
                        rate = float(payload.get('caudal_gas') or 0.0)  # m3/h
                    else:
                        lmin = float(payload.get('caudal_gas_lmin') or 0.0)
                        rate = lmin * 0.06  # conversión L/min a m3/h
                    
                    if last_ts is not None:
                        dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                        delta = max(0.0, rate * dt_hours)
                except Exception:
                    pass
            # Estrategia 3: usar campo gas_flow directo
            elif r.gas_flow is not None:
                try:
                    delta = max(0.0, float(r.gas_flow))
                except Exception:
                    pass
            
            last_ts = ts
            day_key = ts.date().isoformat()
            if delta > 0:
                daily_map[day_key] = daily_map.get(day_key, 0.0) + delta
        
        # Construir vectores de producción real
        days_actual = []
        daily_actual = []
        cumulative_actual = []
        cum = 0.0
        day_cursor = start_time.date()
        today = timezone.now().date()
        
        while day_cursor <= today:
            key = day_cursor.isoformat()
            val = daily_map.get(key, 0.0)
            days_since_start = (day_cursor - start_time.date()).days
            days_actual.append(float(days_since_start))
            daily_actual.append(val)
            cum += val
            cumulative_actual.append(cum)
            day_cursor = day_cursor + timedelta(days=1)
        
        return Response({
            "stage": {
                "id": stage.id,
                "number": stage.number,
                "date": stage.date.isoformat(),
                "material_type": stage.material_type,
                "material_amount_kg": stage.material_amount_kg,
                "temperature_c": stage.temperature_c,
            },
            "expected": series,
            "actual": {
                "days": days_actual,
                "daily_biogas_m3": daily_actual,
                "cumulative_biogas_m3": cumulative_actual,
            }
        })


class SensorReadingViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para lecturas de sensores.
    
    Los sensores reportan automáticamente vía MQTT, por lo que
    no se permite creación manual desde la API REST.
    """
    queryset = SensorReading.objects.all().order_by('-timestamp')
    serializer_class = SensorReadingSerializer
    permission_classes = [IsAuthenticated, PuedeVerDashboard]
    
    def get_queryset(self):
        """
        Filtra lecturas por etapa si se proporciona stage_id como parámetro.
        """
        queryset = super().get_queryset()
        stage_id = self.request.query_params.get('stage_id')
        
        if stage_id:
            queryset = queryset.filter(stage_id=stage_id)
        
        return queryset


class ReportViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de reportes de producción.
    
    Permite crear reportes normales y finales, con generación automática
    de archivos PDF, Excel y CSV con análisis de producción.
    """
    queryset = Report.objects.all().order_by('-created_at')
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [FormParser, MultiPartParser]
    
    def get_permissions(self):
        """Permite acceso sin autenticación para algunas acciones."""
        if self.action in ['create', 'list']:
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=True, methods=['get'])
    def download(self, request, pk=None):
        """
        Descarga archivos del reporte (PDF, Excel o CSV).
        
        Query params:
            filetype: 'pdf', 'excel', o 'csv'
            inline: '1' o 'true' para visualizar en navegador
        """
        report = self.get_object()
        filetype = request.query_params.get('filetype', 'pdf')
        
        file_field = None
        content_type = 'application/octet-stream'
        
        if filetype == 'pdf':
            file_field = report.file_pdf
            content_type = 'application/pdf'
        elif filetype == 'excel':
            file_field = report.file_excel
            content_type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        elif filetype == 'csv':
            file_field = report.file_csv
            content_type = 'text/csv'
        
        if not file_field:
            return Response(
                {'detail': 'Archivo no disponible.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        inline = str(request.GET.get('inline', '')).lower() in ('1', 'true', 'yes')
        response = FileResponse(
            file_field.open(),
            content_type=content_type,
            as_attachment=not inline,
            filename=file_field.name.split('/')[-1]
        )
        return response
    
    @action(detail=True, methods=['post'])
    def regenerate(self, request, pk=None):
        """
        Regenera los archivos de un reporte existente con datos actualizados.
        """
        report = self.get_object()
        # La lógica de regeneración se implementará en el servicio
        # Ver views.RegenerateReportAPIView para referencia
        return Response({
            "detail": "Funcionalidad de regeneración disponible en /api/dashboard/report/regenerate/<id>/"
        })


class ActuatorCommandViewSet(viewsets.ModelViewSet):
    """
    ViewSet para comandos de actuadores.
    
    Permite enviar comandos a dispositivos (electroválvulas, pistones, etc.)
    vía MQTT y mantiene un registro de los comandos enviados.
    """
    queryset = ActuatorCommand.objects.all().order_by('-created_at')
    serializer_class = ActuatorCommandSerializer
    permission_classes = [IsAuthenticated]
    
    def create(self, request, *args, **kwargs):
        """
        Crea y publica un comando de actuador vía MQTT.
        
        El comando se guarda en BD y se publica en el broker MQTT
        para que los dispositivos lo reciban.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cmd = serializer.save(status='PENDING')
        
        # Publicar en MQTT
        try:
            import paho.mqtt.client as mqtt
            import os
            import json
            
            broker_host = os.getenv("MQTT_BROKER_HOST", "mosquitto")
            broker_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))
            topic = os.getenv("MQTT_CONTROL_TOPIC", "control/actuators")
            
            payload = {
                'device': cmd.device,
                'target': cmd.target,
                'action': cmd.action,
                'value': cmd.value,
                'extra': cmd.payload,
            }
            
            client = mqtt.Client()
            client.connect(broker_host, broker_port, 60)
            client.loop_start()
            client.publish(topic, json.dumps(payload))
            client.loop_stop()
            
            cmd.status = 'SENT'
            cmd.response_message = f"Publicado en {topic}"
            cmd.save()
            
            return Response(
                self.get_serializer(cmd).data,
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            cmd.status = 'ERROR'
            cmd.response_message = str(e)
            cmd.save()
            return Response(
                {"detail": f"Error enviando comando: {e}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AlertViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de alertas del sistema.
    
    Las alertas se generan automáticamente cuando se detectan
    condiciones anormales en los sensores o el sistema.
    """
    queryset = Alert.objects.all().order_by('-created_at')
    serializer_class = AlertSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtra alertas no resueltas por defecto.
        
        Query params:
            resolved: 'true' para incluir resueltas
            level: filtrar por nivel (INFO, WARN, CRIT)
        """
        queryset = super().get_queryset()
        
        # Filtrar por estado de resolución
        resolved = self.request.query_params.get('resolved', 'false')
        if resolved.lower() != 'true':
            queryset = queryset.filter(resolved=False)
        
        # Filtrar por nivel si se especifica
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level.upper())
        
        return queryset[:100]  # Limitar a 100 alertas más recientes
    
    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        """
        Marca una alerta como resuelta.
        """
        alert = self.get_object()
        alert.resolved = True
        alert.save()
        return Response({"detail": "Alerta resuelta"})


class CalibrationRecordViewSet(viewsets.ModelViewSet):
    """
    ViewSet para registros de calibración de sensores.
    
    Mantiene el historial de calibraciones realizadas a los sensores,
    incluyendo notas y archivos adjuntos.
    """
    queryset = CalibrationRecord.objects.all().order_by('-date', '-created_at')
    serializer_class = CalibrationRecordSerializer
    permission_classes = [IsAuthenticated, PuedeVerCalibraciones]
    
    def list(self, request, *args, **kwargs):
        """Lista registros de calibración, limitado a 500 más recientes."""
        queryset = self.get_queryset()[:500]
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Exporta todos los registros de calibración a Excel.
        """
        items = self.get_queryset()
        df = pd.DataFrame([
            {
                'Sensor': i.sensor_name,
                'Fecha': i.date.isoformat(),
                'Notas': i.notes,
            } for i in items
        ])
        
        output = io.BytesIO()
        with pd.ExcelWriter(output) as writer:
            df.to_excel(writer, index=False, sheet_name='Calibraciones')
        output.seek(0)
        
        return HttpResponse(
            output.read(),
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={
                'Content-Disposition': 'attachment; filename="calibraciones.xlsx"'
            }
        )


class PracticeSessionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para sesiones de práctica.
    
    Permite iniciar y finalizar sesiones de práctica educativa,
    generando reportes de los datos recopilados durante la sesión.
    """
    queryset = PracticeSession.objects.all().order_by('-started_at')
    serializer_class = PracticeSessionSerializer
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def status(self, request):
        """
        Obtiene el estado actual de las sesiones de práctica.
        
        Returns:
            active: sesión activa actual (si existe)
            last: última sesión registrada
        """
        active = PracticeSession.objects.filter(
            ended_at__isnull=True
        ).order_by('-started_at').first()
        
        last = PracticeSession.objects.order_by('-started_at').first()
        
        return Response({
            'active': self.get_serializer(active).data if active else None,
            'last': self.get_serializer(last).data if last else None,
        })
    
    @action(detail=False, methods=['post'])
    def start(self, request):
        """
        Inicia una nueva sesión de práctica.
        
        Returns:
            Error 400 si ya existe una sesión activa
        """
        active = PracticeSession.objects.filter(ended_at__isnull=True).exists()
        if active:
            return Response(
                {"detail": "Ya existe una práctica activa"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        sess = PracticeSession.objects.create(
            started_by=request.user if request.user.is_authenticated else None
        )
        return Response(
            self.get_serializer(sess).data,
            status=status.HTTP_201_CREATED
        )
    
    @action(detail=False, methods=['post'])
    def stop(self, request):
        """
        Finaliza la sesión de práctica activa y genera reporte.
        
        Query params:
            format: 'excel' (default) o 'csv' para formato de reporte
        """
        sess = PracticeSession.objects.filter(
            ended_at__isnull=True
        ).order_by('-started_at').first()
        
        if not sess:
            return Response(
                {"detail": "No hay práctica activa"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        sess.ended_by = request.user if request.user.is_authenticated else None
        sess.ended_at = timezone.now()
        sess.save()
        
        # Generar reporte de la sesión
        start_dt = sess.started_at
        end_dt = sess.ended_at
        readings = SensorReading.objects.filter(
            timestamp__gte=start_dt,
            timestamp__lte=end_dt
        ).order_by('timestamp')
        
        # Procesar lecturas para reporte
        daily_map = {}
        last_total_gas = None
        last_ts = None
        
        for r in readings:
            ts = r.timestamp
            payload = r.raw_payload or {}
            delta = 0.0
            
            try:
                if isinstance(payload, dict) and 'gas_total_m3' in payload:
                    total = float(payload.get('gas_total_m3') or 0.0)
                    if last_total_gas is not None:
                        delta = max(0.0, total - last_total_gas)
                    last_total_gas = total
                elif isinstance(payload, dict) and ('caudal_gas' in payload or 'caudal_gas_lmin' in payload):
                    if 'caudal_gas' in payload:
                        rate = float(payload.get('caudal_gas') or 0.0)
                    else:
                        lmin = float(payload.get('caudal_gas_lmin') or 0.0)
                        rate = lmin * 0.06
                    
                    if last_ts is not None:
                        dt_hours = max(0.0, (ts - last_ts).total_seconds() / 3600.0)
                        delta = max(0.0, rate * dt_hours)
                elif r.gas_flow is not None:
                    delta = max(0.0, float(r.gas_flow))
            except Exception:
                pass
            
            last_ts = ts
            if delta > 0:
                day_key = ts.date().isoformat()
                daily_map[day_key] = daily_map.get(day_key, 0.0) + delta
        
        df = pd.DataFrame({
            'Fecha': list(daily_map.keys()),
            'Producción Real (m3/día)': list(daily_map.values()),
        })
        
        fmt = request.query_params.get('format', 'excel')
        
        if fmt == 'csv':
            csv_buffer = io.StringIO()
            df.to_csv(csv_buffer, index=False)
            return HttpResponse(
                csv_buffer.getvalue(),
                content_type='text/csv',
                headers={
                    'Content-Disposition': f'attachment; filename="reporte_practica_{sess.id}.csv"'
                }
            )
        else:
            output = io.BytesIO()
            with pd.ExcelWriter(output) as writer:
                # Hoja de resumen
                cover = pd.DataFrame({
                    'Campo': ['Tipo', 'Inicio', 'Fin', 'Duración (min)'],
                    'Valor': [
                        'Reporte de práctica',
                        start_dt.strftime('%Y-%m-%d %H:%M'),
                        end_dt.strftime('%Y-%m-%d %H:%M'),
                        round((end_dt - start_dt).total_seconds() / 60.0, 1),
                    ]
                })
                cover.to_excel(writer, index=False, sheet_name='Resumen')
                df.to_excel(writer, index=False, sheet_name='Datos')
            
            output.seek(0)
            return HttpResponse(
                output.read(),
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                headers={
                    'Content-Disposition': f'attachment; filename="reporte_practica_{sess.id}.xlsx"'
                }
            )
