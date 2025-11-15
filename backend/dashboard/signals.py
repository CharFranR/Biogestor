"""
Signals para el módulo dashboard.

Maneja notificaciones en tiempo real vía websocket para eventos
relacionados con sensores, alertas y reportes.
"""

from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.contrib.auth.models import User
import logging

from .models import (
    SensorReading,
    Alert,
    Report,
    FillingStage,
    ActuatorCommand,
    CalibrationRecord,
    PracticeSession
)


logger = logging.getLogger(__name__)


@receiver(post_save, sender=SensorReading)
def sensor_reading_created(sender, instance, created, **kwargs):
    """
    Notifica cuando se crea una nueva lectura de sensor.
    
    Envía la lectura a todos los usuarios conectados al websocket
    del dashboard para actualización en tiempo real.
    """
    if created:
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Preparar datos de la lectura
            reading_data = {
                'type': 'sensor_reading',
                'reading_id': instance.id,
                'stage_id': instance.stage_id,
                'timestamp': str(instance.timestamp),
                'pressure_hpa': instance.pressure_hpa,
                'biol_flow': instance.biol_flow,
                'gas_flow': instance.gas_flow,
                'raw_payload': instance.raw_payload,
            }
            
            # Enviar a grupo de sensores (todos los usuarios con acceso al dashboard)
            async_to_sync(channel_layer.group_send)(
                'sensors',
                reading_data
            )
            
            logger.debug(f"Notificación de lectura de sensor {instance.id} enviada")
            
        except Exception as e:
            logger.error(f"Error en signal sensor_reading_created: {e}")


@receiver(post_save, sender=Alert)
def alert_created(sender, instance, created, **kwargs):
    """
    Notifica cuando se crea una nueva alerta.
    
    Envía notificación a todos los administradores sobre la alerta.
    Las alertas críticas tienen prioridad y se marcan especialmente.
    """
    if created:
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            # Preparar datos de la alerta
            alert_data = {
                'type': 'alert_notification',
                'alert_id': instance.id,
                'level': instance.level,
                'message': instance.message,
                'details': instance.details,
                'created_at': str(instance.created_at),
                'is_critical': instance.level == 'CRIT',
            }
            
            # Enviar a todos los usuarios autenticados (grupo alerts)
            async_to_sync(channel_layer.group_send)(
                'alerts',
                alert_data
            )
            
            # Si es crítica, notificar específicamente a administradores
            if instance.level == 'CRIT':
                notify_admins_critical_alert(instance)
            
            logger.info(f"Alerta {instance.level} creada: {instance.message}")
            
        except Exception as e:
            logger.error(f"Error en signal alert_created: {e}")


@receiver(post_save, sender=Alert)
def alert_resolved(sender, instance, created, **kwargs):
    """
    Notifica cuando una alerta se resuelve.
    """
    if not created and instance.pk:
        try:
            # Verificar si cambió a resuelta
            try:
                old_instance = Alert.objects.get(pk=instance.pk)
                if not old_instance.resolved and instance.resolved:
                    channel_layer = get_channel_layer()
                    if channel_layer:
                        async_to_sync(channel_layer.group_send)(
                            'alerts',
                            {
                                'type': 'alert_resolved',
                                'alert_id': instance.id,
                                'message': f'Alerta resuelta: {instance.message}',
                            }
                        )
                        logger.info(f"Alerta {instance.id} resuelta")
            except Alert.DoesNotExist:
                pass
                
        except Exception as e:
            logger.error(f"Error en signal alert_resolved: {e}")


@receiver(post_save, sender=Report)
def report_created(sender, instance, created, **kwargs):
    """
    Notifica cuando se genera un nuevo reporte.
    
    Envía notificación a usuarios con permisos de ver reportes.
    """
    if created:
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            report_data = {
                'type': 'report_notification',
                'report_id': instance.id,
                'report_type': instance.report_type,
                'stage_id': instance.stage_id,
                'created_at': str(instance.created_at),
                'has_pdf': bool(instance.file_pdf),
                'has_excel': bool(instance.file_excel),
                'has_csv': bool(instance.file_csv),
            }
            
            # Enviar a grupo de reportes
            async_to_sync(channel_layer.group_send)(
                'reports',
                report_data
            )
            
            logger.info(f"Notificación de reporte {instance.id} enviada")
            
        except Exception as e:
            logger.error(f"Error en signal report_created: {e}")


@receiver(post_save, sender=FillingStage)
def filling_stage_status_changed(sender, instance, created, **kwargs):
    """
    Notifica cuando cambia el estado de una etapa de llenado.
    
    Importante para mantener sincronizados los dashboards de todos
    los usuarios cuando se abre o cierra una etapa.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        if created:
            event_type = 'filling_stage_created'
            message = f'Nueva etapa de llenado #{instance.number} creada'
        else:
            # Verificar si cambió el estado activo
            try:
                old_instance = FillingStage.objects.get(pk=instance.pk)
                if old_instance.active != instance.active:
                    event_type = 'filling_stage_closed' if not instance.active else 'filling_stage_opened'
                    message = f'Etapa #{instance.number} {"cerrada" if not instance.active else "abierta"}'
                else:
                    return  # No hubo cambio de estado relevante
            except FillingStage.DoesNotExist:
                return
        
        stage_data = {
            'type': event_type,
            'stage_id': instance.id,
            'stage_number': instance.number,
            'active': instance.active,
            'material_type': instance.material_type,
            'message': message,
        }
        
        # Enviar a grupo de stages
        async_to_sync(channel_layer.group_send)(
            'filling_stages',
            stage_data
        )
        
        logger.info(message)
        
    except Exception as e:
        logger.error(f"Error en signal filling_stage_status_changed: {e}")


@receiver(post_save, sender=ActuatorCommand)
def actuator_command_status_changed(sender, instance, created, **kwargs):
    """
    Notifica cambios en el estado de comandos de actuadores.
    
    Permite a los usuarios monitorear el estado de sus comandos
    (PENDING, SENT, ERROR) en tiempo real.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        command_data = {
            'type': 'actuator_command_update',
            'command_id': instance.id,
            'device': instance.device,
            'target': instance.target,
            'action': instance.action,
            'status': instance.status,
            'response_message': instance.response_message,
            'created_at': str(instance.created_at),
        }
        
        # Enviar a grupo de actuadores
        async_to_sync(channel_layer.group_send)(
            'actuators',
            command_data
        )
        
        logger.debug(f"Notificación de comando de actuador {instance.id} enviada")
        
    except Exception as e:
        logger.error(f"Error en signal actuator_command_status_changed: {e}")


@receiver(post_save, sender=PracticeSession)
def practice_session_status_changed(sender, instance, created, **kwargs):
    """
    Notifica sobre inicio o fin de sesiones de práctica.
    
    Permite a los usuarios saber cuándo hay una práctica activa.
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        if created:
            event_type = 'practice_started'
            message = 'Nueva sesión de práctica iniciada'
        elif instance.ended_at:
            event_type = 'practice_ended'
            message = 'Sesión de práctica finalizada'
        else:
            return
        
        session_data = {
            'type': event_type,
            'session_id': instance.id,
            'started_at': str(instance.started_at),
            'ended_at': str(instance.ended_at) if instance.ended_at else None,
            'is_active': instance.is_active,
            'message': message,
        }
        
        # Enviar a grupo de prácticas
        async_to_sync(channel_layer.group_send)(
            'practices',
            session_data
        )
        
        logger.info(message)
        
    except Exception as e:
        logger.error(f"Error en signal practice_session_status_changed: {e}")


@receiver(post_save, sender=CalibrationRecord)
def calibration_record_created(sender, instance, created, **kwargs):
    """
    Notifica cuando se registra una nueva calibración.
    
    Importante para mantener al día el historial de calibraciones.
    """
    if created:
        try:
            channel_layer = get_channel_layer()
            if not channel_layer:
                return
            
            calibration_data = {
                'type': 'calibration_recorded',
                'calibration_id': instance.id,
                'sensor_name': instance.sensor_name,
                'date': str(instance.date),
                'notes': instance.notes,
                'has_attachment': bool(instance.attachment),
            }
            
            # Enviar a grupo de calibraciones
            async_to_sync(channel_layer.group_send)(
                'calibrations',
                calibration_data
            )
            
            logger.info(f"Calibración registrada para sensor {instance.sensor_name}")
            
        except Exception as e:
            logger.error(f"Error en signal calibration_record_created: {e}")


def notify_admins_critical_alert(alert):
    """
    Envía notificación específica a administradores sobre alerta crítica.
    
    Args:
        alert: Instancia de Alert con nivel CRIT
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        # Obtener todos los administradores
        admin_users = User.objects.filter(is_staff=True).distinct()
        
        critical_alert_data = {
            'type': 'critical_alert',
            'alert_id': alert.id,
            'message': f'⚠️ ALERTA CRÍTICA: {alert.message}',
            'details': alert.details,
            'created_at': str(alert.created_at),
        }
        
        # Enviar a cada administrador
        for admin in admin_users:
            try:
                async_to_sync(channel_layer.group_send)(
                    f'user_{admin.id}',
                    critical_alert_data
                )
            except Exception as e:
                logger.error(f"Error enviando alerta crítica a admin {admin.id}: {e}")
        
        logger.warning(f"Alerta crítica enviada a {admin_users.count()} administradores: {alert.message}")
        
    except Exception as e:
        logger.error(f"Error en notify_admins_critical_alert: {e}")
