# Despliegue de Biogestor en Ubuntu (paso a paso para principiantes)

Esta guía te lleva de cero a tener Biogestor funcionando en un servidor Ubuntu con:
- Backend Django (ASGI) ejecutándose como servicio del sistema
- Frontend (React) servido por Nginx en la misma URL (mismo origen)
- PostgreSQL vía Docker (usando el `docker-compose.yml` del repo)
- WebSocket funcionando detrás de Nginx

Si te atoras en un paso, dime en qué punto estás y lo resolvemos.

## 0) Requisitos previos

- Servidor Ubuntu 22.04/24.04 (con acceso sudo)
- Dominio o IP pública (para pruebas basta IP)
- Puertos 80 (HTTP) y 443 (HTTPS) abiertos en el firewall
- Git instalado en el servidor (suele venir) y Docker Engine + docker compose plugin

Opcional (para construir el frontend en el servidor): Node.js 18+ y npm.

## 1) Preparar el servidor (una sola vez)

Instala paquetes (Nginx, Docker, Python venv, etc.):

```bash
# Actualiza paquetes
sudo apt update && sudo apt upgrade -y

# Herramientas básicas
sudo apt install -y git nginx python3-venv python3-pip

# Docker Engine + compose plugin (si no lo tienes)
sudo apt install -y docker.io docker-compose-plugin
sudo systemctl enable --now docker

# (Opcional) Node.js 18 para construir el frontend en el servidor
# Si ya traerás la carpeta dist/ desde tu PC, puedes saltarte esto
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

## 2) Clonar el proyecto y definir rutas de trabajo

Usaremos `/srv/biogestor` como ruta estándar:

```bash
sudo mkdir -p /srv/biogestor
sudo chown "$USER":"$USER" /srv/biogestor
cd /srv/biogestor

git clone https://github.com/CharFranR/Biogestor.git .
```

Estructura relevante tras clonar:
- `/srv/biogestor/backend` → Django
- `/srv/biogestor/frontend/react-app` → React (Vite)
- `/srv/biogestor/docker-compose.yml` → PostgreSQL

## 3) Base de datos (PostgreSQL con Docker)

El repo ya trae un `docker-compose.yml` con PostgreSQL. Levántalo:

```bash
cd /srv/biogestor
sudo docker compose up -d
```

Credenciales por defecto (puedes cambiarlas más adelante):
- Usuario: `postgres`
- Password: `mi_password`
- DB: `biogestor`
- Puerto: `5432`

## 4) Variables de entorno del backend

Crea el archivo `/srv/biogestor/backend/BGProject/.env`:

```env
DJANGO_SECRET_KEY=pon_aqui_una_clave_larga_y_unica
DEBUG=False
# IP o dominio del servidor (puedes poner varios separados por coma)
ALLOWED_HOSTS=127.0.0.1,localhost,tu_dominio.com,tu_ip_publica

# Si usas HTTPS con dominio, agrega también aquí (opcional, útil si usas cookies)
CSRF_TRUSTED_ORIGINS=https://tu_dominio.com

# En producción misma URL (mismo origen), no necesitas CORS; puedes dejarlo vacío
# CORS_ALLOWED_ORIGINS=
```

Nota: Los settings ya leen este `.env`. Si no lo creas, Django no arrancará por falta de `DJANGO_SECRET_KEY`.

## 5) Backend: entorno virtual, dependencias y migraciones

```bash
cd /srv/biogestor
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

cd backend
python manage.py migrate
python manage.py collectstatic --noinput

# Crea el primer superusuario (administrador)
python manage.py createsuperuser
```

Esto genera:
- Base de datos inicial migrada
- Archivos estáticos en `backend/staticfiles/`
- Usuario admin para aprobar otros usuarios

## 6) Frontend: construir (build) la app

Opción A: construir en el servidor (requiere Node.js):

```bash
cd /srv/biogestor/frontend/react-app
npm install
npm run build
```

Opción B: construir en tu PC y subir la carpeta `dist/` al servidor (copiar a `/srv/biogestor/frontend/react-app/dist`).

## 7) Servicio del backend (systemd)

Crea el archivo de servicio con el contenido del template incluido en el repo:

- Copia `deploy/systemd/biogestor-backend.service` a `/etc/systemd/system/` y ajústalo si cambiaste rutas.

```bash
sudo cp /srv/biogestor/deploy/systemd/biogestor-backend.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now biogestor-backend
sudo systemctl status biogestor-backend --no-pager
```

El servicio levanta Daphne (ASGI) en `127.0.0.1:8000` usando el venv de `/srv/biogestor/.venv`.

## 8) Nginx como reverse proxy (misma URL para todo)

Usa el archivo `deploy/nginx-biogestor.conf` como base:

```bash
sudo cp /srv/biogestor/deploy/nginx-biogestor.conf /etc/nginx/sites-available/biogestor
sudo ln -s /etc/nginx/sites-available/biogestor /etc/nginx/sites-enabled/biogestor

# Deshabilita el default si estorba
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl reload nginx
```

Qué hace esta config:
- Sirve el frontend estático desde `frontend/react-app/dist/`
- Expone `/api/` hacia el backend ASGI en `127.0.0.1:8000`
- Maneja WebSocket en `/ws/` con upgrade correcto
- Expone `/static/` y `/media/` desde el backend

## 9) (Opcional) HTTPS con Let’s Encrypt

Si ya apuntas un dominio al servidor, puedes obtener TLS gratis:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tu_dominio.com
```

Certbot actualizará el bloque de Nginx. Recarga Nginx tras la emisión.

## 10) Verificación rápida

- Abre `http://TU_IP` o `https://TU_DOMINIO`
- Inicia sesión con el usuario admin que creaste
- Ve a la pantalla de Sensores y verifica que el WebSocket conecta (icono de conexión o mensajes en consola del navegador)
- Genera un reporte y prueba descargar un archivo (PDF/Excel/CSV)

Si algo falla, dime exactamente en qué paso y mensaje de error sale.

## 11) Mantenimiento básico

- Ver logs del backend: `sudo journalctl -u biogestor-backend -f`
- Ver logs de Nginx: `/var/log/nginx/access.log` y `/var/log/nginx/error.log`
- Actualizar código:
  ```bash
  cd /srv/biogestor
  git pull
  source .venv/bin/activate
  pip install -r requirements.txt
  cd backend && python manage.py migrate && python manage.py collectstatic --noinput
  sudo systemctl restart biogestor-backend
  sudo systemctl reload nginx
  ```

## 12) Notas y futuras mejoras

- Para cargas altas de WebSocket, usa Redis como channel layer (instala Redis y habilita `channels_redis` en settings).
- Puedes mover PostgreSQL a un servicio administrado o instalarlo nativo si prefieres.
- Agregar un endpoint `/healthz` simple en el backend ayuda a monitoreo.
