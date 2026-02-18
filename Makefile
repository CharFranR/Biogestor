SHELL := /bin/sh

# Configuración por defecto (se puede sobrescribir en línea de comando)
ADMIN_USERNAME ?= admin
ADMIN_EMAIL ?= admin@biogestor.local
ADMIN_PASSWORD ?= admin123
ADMIN_FIRST_NAME ?= Admin
ADMIN_LAST_NAME ?= Biogestor

.PHONY: help admin-default

help:
	@echo "Comandos disponibles:"
	@echo "  make admin-default"
	@echo "  make admin-default ADMIN_USERNAME=miadmin ADMIN_PASSWORD=misecreto"

admin-default:
	@echo "Provisionando usuario admin por defecto en contenedor backend..."
	docker compose exec backend python manage.py shell -c "from django.contrib.auth import get_user_model; from authentication.models import Profile, Permissions; from authentication.views import ALL_PERMISSION_FIELDS; User=get_user_model(); username='$(ADMIN_USERNAME)'; email='$(ADMIN_EMAIL)'; password='$(ADMIN_PASSWORD)'; first_name='$(ADMIN_FIRST_NAME)'; last_name='$(ADMIN_LAST_NAME)'; user, created = User.objects.get_or_create(username=username, defaults={'email': email, 'first_name': first_name, 'last_name': last_name}); user.email=email; user.first_name=first_name; user.last_name=last_name; user.is_superuser=True; user.is_staff=True; user.is_active=True; user.set_password(password); user.save(); profile, _ = Profile.objects.get_or_create(user=user, defaults={'aprobado': True, 'rol': 'ADMIN', 'permissions': Permissions.objects.create()}); profile.permissions = profile.permissions or Permissions.objects.create(); profile.save(update_fields=['permissions']); perms = profile.permissions; [setattr(perms, field, True) for field in ALL_PERMISSION_FIELDS]; perms.save(); profile.aprobado=True; profile.rol='ADMIN'; profile.save(update_fields=['aprobado','rol']); print({'username': user.username, 'created': created, 'is_superuser': user.is_superuser, 'is_staff': user.is_staff, 'aprobado': profile.aprobado, 'rol': profile.rol})"
	@echo "Admin provisionado correctamente."
