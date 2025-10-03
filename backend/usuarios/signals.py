from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Perfil


@receiver(post_save, sender=User)
def crear_perfil(sender, instance, created, **kwargs):
    if created:
        # Verificar si es el primer usuario de la aplicación
        es_primer_usuario = User.objects.count() == 1

        # Crear perfil
        perfil = Perfil.objects.create(user=instance)

        # Si es el primer usuario, hacerlo superusuario y aprobado
        if es_primer_usuario:
            instance.is_superuser = True
            instance.is_staff = True
            instance.save()
            perfil.aprobado = True
            perfil.save()
