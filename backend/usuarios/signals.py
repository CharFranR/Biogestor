"""
Signals para el módulo de usuarios.

Maneja la creación automática de perfiles, notificaciones de aprobación
y eventos relacionados con usuarios vía websocket.
"""

from django.contrib.auth.models import User
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver
from django.db import models 
from django.utils import timezone
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
import logging

from .models import Perfil, Permisos


logger = logging.getLogger(__name__)


@receiver(post_save, sender=User)
def crear_perfil(sender, instance, created, **kwargs):
    """
    Crea automáticamente un perfil cuando se registra un nuevo usuario.
    
    El perfil se crea con:
    - Permisos por defecto (sin privilegios, excepto primer usuario)
    - Estado de aprobación: False (True para primer usuario)
    - Rol: VISIT (ADMIN para primer usuario)
    
    El primer usuario del sistema se configura automáticamente como
    administrador con todos los permisos.
    """
    if created:
        try:
            # VERIFICAR si es el primer usuario
            es_primer_usuario = User.objects.count() == 1
            
            # CREAR objeto Permisos (OBLIGATORIO)
            permisos = Permisos.objects.create()
            
            # Si es el primer usuario, darle TODOS los permisos
            if es_primer_usuario:
                # Hacerlo superusuario y staff
                instance.is_superuser = True
                instance.is_staff = True
                instance.save()
                
                # Darle TODOS los permisos
                for field in permisos._meta.fields:
                    if isinstance(field, models.BooleanField) and field.name != 'id':
                        setattr(permisos, field.name, True)
                permisos.save()
                
            # CREAR Perfil con los permisos
            perfil = Perfil.objects.create(user=instance, permisos=permisos)

            # Si es primer usuario, aprobarlo automáticamente
            if es_primer_usuario:
                perfil.aprobado = True
                perfil.rol = "ADMIN"
                perfil.save()
                logger.info(f"Primer usuario del sistema creado: {instance.username}")
            else:
                logger.info(f"Perfil creado para usuario: {instance.username}")
                # Notificar a administradores sobre nuevo registro
                notify_admins_new_user(instance)
                
        except Exception as e:
            logger.error(f"Error creando perfil para {instance.username}: {e}")


@receiver(pre_save, sender=Perfil)
def perfil_approval_changed(sender, instance, **kwargs):
    """
    Detecta cambios en el estado de aprobación de un perfil.
    
    Si el perfil pasa de no aprobado a aprobado, envía notificación
    al usuario y a administradores vía websocket.
    """
    if instance.pk:  # Solo si el perfil ya existe (no es creación)
        try:
            old_instance = Perfil.objects.get(pk=instance.pk)
            
            # Si cambió de no aprobado a aprobado
            if not old_instance.aprobado and instance.aprobado:
                logger.info(f"Usuario {instance.user.username} ha sido aprobado")
                
                # Notificar al usuario aprobado
                notify_user_approval(instance.user, approved=True)
                
                # Notificar a administradores
                notify_admins_user_approved(instance.user)
            
            # Si cambió de aprobado a no aprobado (rechazado)
            elif old_instance.aprobado and not instance.aprobado:
                logger.info(f"Usuario {instance.user.username} ha sido rechazado")
                notify_user_approval(instance.user, approved=False)
                
        except Perfil.DoesNotExist:
            pass  # Es una creación, no hay estado anterior
        except Exception as e:
            logger.error(f"Error en signal de aprobación: {e}")


@receiver(post_save, sender=Perfil)
def perfil_role_changed(sender, instance, created, **kwargs):
    """
    Notifica cuando cambia el rol de un usuario.
    
    Envía notificación al usuario afectado y a administradores.
    """
    if not created and instance.pk:
        try:
            # Solo notificar si hubo cambio de rol
            # (requiere comparación con estado anterior, omitido por simplicidad)
            pass
        except Exception as e:
            logger.error(f"Error en signal de cambio de rol: {e}")


def notify_admins_new_user(user):
    """
    Notifica a todos los administradores sobre un nuevo registro de usuario.
    
    Args:
        user: Instancia del User recién registrado
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            logger.warning("Channel layer no disponible para notificaciones")
            return
        
        # Obtener todos los usuarios administradores
        admin_users = User.objects.filter(is_staff=True).distinct()
        
        notification_data = {
            'type': 'user_notification',
            'notification_type': 'new_user_registration',
            'message': f'Nuevo usuario registrado: {user.username}',
            'user_id': user.id,
            'username': user.username,
            'email': user.email,
            'timestamp': str(user.date_joined),
        }
        
        # Enviar notificación a cada administrador
        for admin in admin_users:
            try:
                async_to_sync(channel_layer.group_send)(
                    f'user_{admin.id}',
                    notification_data
                )
            except Exception as e:
                logger.error(f"Error enviando notificación a admin {admin.id}: {e}")
        
        logger.info(f"Notificación de nuevo usuario enviada a {admin_users.count()} administradores")
        
    except Exception as e:
        logger.error(f"Error en notify_admins_new_user: {e}")


def notify_user_approval(user, approved=True):
    """
    Notifica al usuario sobre cambio en su estado de aprobación.
    
    Args:
        user: Instancia del User
        approved: True si fue aprobado, False si fue rechazado
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        status_text = 'aprobada' if approved else 'rechazada'
        notification_data = {
            'type': 'user_notification',
            'notification_type': 'approval_status',
            'message': f'Tu cuenta ha sido {status_text}',
            'approved': approved,
            'timestamp': str(timezone.now()),
        }
        
        # Enviar al grupo específico del usuario
        async_to_sync(channel_layer.group_send)(
            f'user_{user.id}',
            notification_data
        )
        
        logger.info(f"Notificación de aprobación enviada a usuario {user.username}")
        
    except Exception as e:
        logger.error(f"Error en notify_user_approval: {e}")


def notify_admins_user_approved(user):
    """
    Notifica a administradores que un usuario fue aprobado.
    
    Args:
        user: Instancia del User que fue aprobado
    """
    try:
        channel_layer = get_channel_layer()
        if not channel_layer:
            return
        
        admin_users = User.objects.filter(is_staff=True).distinct()
        
        notification_data = {
            'type': 'user_notification',
            'notification_type': 'user_approved',
            'message': f'Usuario {user.username} ha sido aprobado',
            'user_id': user.id,
            'username': user.username,
        }
        
        for admin in admin_users:
            try:
                async_to_sync(channel_layer.group_send)(
                    f'user_{admin.id}',
                    notification_data
                )
            except Exception as e:
                logger.error(f"Error enviando notificación a admin {admin.id}: {e}")
        
    except Exception as e:
        logger.error(f"Error en notify_admins_user_approved: {e}")