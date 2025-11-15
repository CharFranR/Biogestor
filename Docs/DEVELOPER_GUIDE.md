# Guía de Desarrollo - Biogestor

## Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración del Entorno](#configuración-del-entorno)
3. [Estructura del Proyecto](#estructura-del-proyecto)
4. [Desarrollo con Docker](#desarrollo-con-docker)
5. [Desarrollo Local](#desarrollo-local)
6. [Testing](#testing)
7. [Mejores Prácticas](#mejores-prácticas)
8. [Solución de Problemas](#solución-de-problemas)

---

## Requisitos Previos

### Software Requerido

- **Docker Desktop**: 20.10+
- **Docker Compose**: 2.0+
- **Git**: 2.30+
- **Node.js**: 20.x (para desarrollo frontend)
- **Python**: 3.13+ (para desarrollo backend)
- **PostgreSQL**: 15+ (opcional, para desarrollo local)
- **Redis**: 7+ (opcional, para desarrollo local)

### Conocimientos Recomendados

- Python y Django
- JavaScript/TypeScript y React
- Docker y contenedores
- Bases de datos relacionales (PostgreSQL)
- Protocolos de comunicación (HTTP, WebSocket, MQTT)
- Git y control de versiones

---

## Configuración del Entorno

### 1. Clonar el Repositorio

```bash
git clone https://github.com/CharFranR/Biogestor.git
cd Biogestor
```

### 2. Configurar Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
```

Editar `.env` con tus configuraciones:

```env
# Django
DJANGO_SECRET_KEY=tu_clave_secreta_muy_larga_y_segura
DEBUG=True
DJANGO_LOG_LEVEL=INFO

# Base de Datos
POSTGRES_DB=biogestor
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres123

# Redis
REDIS_URL=redis://redis:6379

# MQTT
MQTT_BROKER_HOST=mosquitto
MQTT_BROKER_PORT=1883
MQTT_CONTROL_TOPIC=control/actuators

# Frontend
REACT_APP_API_URL=http://localhost:8000
REACT_APP_WS_URL=ws://localhost:8000
```

**⚠️ IMPORTANTE:** Nunca commitees el archivo `.env` con credenciales reales.

### 3. Iniciar con Docker (Recomendado)

```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# O en modo detached (segundo plano)
docker-compose up -d --build
```

Servicios disponibles:
- **Backend API**: http://localhost:8000
- **Frontend**: http://localhost:8080
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **MQTT Broker**: localhost:1883

### 4. Crear Superusuario

```bash
# Acceder al contenedor del backend
docker-compose exec backend bash

# Crear superusuario
python manage.py createsuperuser

# Salir del contenedor
exit
```

### 5. Acceder a la Aplicación

- **Frontend**: http://localhost:8080
- **Admin Django**: http://localhost:8000/admin
- **API REST**: http://localhost:8000/api/

---

## Estructura del Proyecto

```
Biogestor/
├── backend/                    # Backend Django
│   ├── BGProject/              # Configuración principal
│   │   ├── settings.py         # Configuración
│   │   ├── urls.py             # URLs principales
│   │   ├── asgi.py             # Configuración ASGI (WebSockets)
│   │   └── wsgi.py             # Configuración WSGI
│   ├── dashboard/              # Módulo dashboard
│   │   ├── models.py           # Modelos de datos
│   │   ├── views.py            # Vistas (legacy)
│   │   ├── viewsets.py         # ViewSets REST
│   │   ├── serializers.py      # Serializers DRF
│   │   ├── signals.py          # Señales Django
│   │   ├── consumer.py         # WebSocket consumer
│   │   ├── device_models.py    # Modelos de dispositivos
│   │   ├── device_viewsets.py  # ViewSets de dispositivos
│   │   └── urls.py             # URLs del módulo
│   ├── usuarios/               # Módulo de usuarios
│   │   ├── models.py           # Perfil, Permisos
│   │   ├── viewsets.py         # ViewSets de usuarios
│   │   ├── serializers.py      # Serializers
│   │   ├── signals.py          # Señales de usuarios
│   │   └── permisos.py         # Clases de permisos
│   ├── biocalculadora/         # Cálculos biodigestor
│   │   ├── calculators.py      # Modelo matemático
│   │   ├── README_MODEL.md     # Documentación del modelo
│   │   └── views.py            # Endpoints de cálculo
│   ├── recursos/               # Módulo de recursos
│   ├── inventario/             # Módulo de inventario
│   ├── media/                  # Archivos subidos
│   ├── staticfiles/            # Archivos estáticos
│   ├── Dockerfile              # Docker para backend
│   └── requirements.txt        # Dependencias Python
│
├── frontend/                   # Frontend React
│   └── react-app/
│       ├── src/
│       │   ├── components/     # Componentes React
│       │   ├── services/       # Servicios API
│       │   ├── shared/         # Componentes compartidos
│       │   └── main.tsx        # Punto de entrada
│       ├── public/             # Archivos públicos
│       ├── Dockerfile          # Docker para frontend
│       ├── nginx.conf          # Configuración Nginx
│       └── package.json        # Dependencias Node.js
│
├── deploy/                     # Configuraciones de deployment
│   └── mosquitto.conf          # Configuración MQTT
│
├── Docs/                       # Documentación
│   ├── API_DOCUMENTATION.md    # Documentación de API
│   ├── DEVELOPER_GUIDE.md      # Esta guía
│   └── DEPLOYMENT.md           # Guía de deployment
│
├── scripts/                    # Scripts útiles
│   └── mqtt_simulator.py       # Simulador MQTT
│
├── docker-compose.yml          # Orquestación Docker
├── .env                        # Variables de entorno (no commitear)
├── .gitignore                  # Archivos ignorados por Git
└── README.md                   # README principal
```

---

## Desarrollo con Docker

### Comandos Útiles

```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar un servicio
docker-compose restart backend

# Detener todos los servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ elimina datos)
docker-compose down -v

# Reconstruir un servicio específico
docker-compose build backend
docker-compose up -d backend

# Ejecutar comandos en un contenedor
docker-compose exec backend python manage.py shell
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py test

# Acceder al shell de un contenedor
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Desarrollo con Hot Reload

Los contenedores están configurados con volúmenes que permiten hot reload:

**Backend:**
```bash
# Los cambios en archivos .py se recargan automáticamente
# Si instalas nuevas dependencias:
docker-compose exec backend pip install nuevo-paquete
docker-compose restart backend
```

**Frontend:**
```bash
# Para desarrollo con hot reload, ejecuta Vite en local:
cd frontend/react-app
npm install
npm run dev
# Frontend disponible en http://localhost:5173
```

### Ejecutar Migraciones

```bash
# Crear nuevas migraciones
docker-compose exec backend python manage.py makemigrations

# Aplicar migraciones
docker-compose exec backend python manage.py migrate

# Ver estado de migraciones
docker-compose exec backend python manage.py showmigrations
```

### Gestionar Dependencias

**Backend:**
```bash
# Agregar nueva dependencia
docker-compose exec backend pip install nueva-libreria

# Actualizar requirements.txt
docker-compose exec backend pip freeze > requirements.txt

# Reinstalar dependencias después de cambios
docker-compose build backend
docker-compose up -d backend
```

**Frontend:**
```bash
# Agregar nueva dependencia
cd frontend/react-app
npm install nueva-libreria

# Reconstruir contenedor
docker-compose build frontend
docker-compose up -d frontend
```

---

## Desarrollo Local (sin Docker)

### Backend

```bash
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
# En Linux/Mac:
source venv/bin/activate
# En Windows:
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
export POSTGRES_DB=biogestor
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=postgres
export REDIS_URL=redis://localhost:6379

# Ejecutar migraciones
python manage.py migrate

# Crear superusuario
python manage.py createsuperuser

# Iniciar servidor de desarrollo
# Usando Daphne (con WebSockets):
daphne -b 0.0.0.0 -p 8000 BGProject.asgi:application

# O usando runserver (sin WebSockets):
python manage.py runserver
```

### Frontend

```bash
cd frontend/react-app

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Frontend disponible en http://localhost:5173
```

### Servicios Externos

Necesitarás PostgreSQL, Redis y Mosquitto ejecutándose localmente:

```bash
# PostgreSQL (Ubuntu/Debian)
sudo apt install postgresql
sudo service postgresql start

# Redis (Ubuntu/Debian)
sudo apt install redis-server
sudo service redis-server start

# Mosquitto (Ubuntu/Debian)
sudo apt install mosquitto
sudo service mosquitto start
```

---

## Testing

### Backend

```bash
# Ejecutar todos los tests
docker-compose exec backend python manage.py test

# Ejecutar tests de un módulo específico
docker-compose exec backend python manage.py test dashboard

# Ejecutar tests con cobertura
docker-compose exec backend coverage run --source='.' manage.py test
docker-compose exec backend coverage report
docker-compose exec backend coverage html  # Genera reporte HTML
```

### Frontend

```bash
cd frontend/react-app

# Ejecutar tests
npm test

# Ejecutar tests con cobertura
npm run test:coverage

# Ejecutar linter
npm run lint
```

### Tests de Integración

```bash
# Simulador MQTT para pruebas
python scripts/mqtt_simulator.py

# Enviar datos de prueba
# Editar el script para tus necesidades
```

---

## Mejores Prácticas

### Código

1. **Sigue PEP 8** para código Python
2. **Usa ESLint** configuración para código JavaScript/TypeScript
3. **Escribe docstrings** para funciones y clases
4. **Comenta código complejo** pero evita comentarios obvios
5. **Usa type hints** en Python cuando sea posible
6. **Maneja errores apropiadamente** con try/except y validaciones

### Git

1. **Commits atómicos:** Un commit por cambio lógico
2. **Mensajes descriptivos:** 
   ```
   feat: agregar registro de dispositivos IoT
   fix: corregir cálculo de producción de biogás
   docs: actualizar guía de desarrollo
   refactor: migrar views a viewsets
   ```
3. **Branches:** Usa feature branches
   ```bash
   git checkout -b feature/nueva-funcionalidad
   git checkout -b fix/corregir-bug
   ```
4. **Pull Requests:** Siempre revisa código antes de merge

### Seguridad

1. **Nunca commitees credenciales**
2. **Usa variables de entorno** para configuración sensible
3. **Valida entrada de usuarios** siempre
4. **Sanitiza queries SQL** (Django ORM lo hace automáticamente)
5. **Implementa rate limiting** en endpoints públicos
6. **Mantén dependencias actualizadas**

### Performance

1. **Usa caché Redis** para datos frecuentes
2. **Optimiza queries** con `select_related()` y `prefetch_related()`
3. **Pagina resultados** grandes
4. **Usa índices** en campos frecuentemente consultados
5. **Monitorea logs** para identificar cuellos de botella

---

## Solución de Problemas

### Backend no inicia

```bash
# Verificar logs
docker-compose logs backend

# Posibles causas:
# 1. Error en configuración
# 2. Puerto 8000 ocupado
# 3. Problema con migraciones

# Soluciones:
docker-compose down
docker-compose up --build
```

### Frontend no se conecta al backend

```bash
# Verificar variables de entorno
cat frontend/react-app/.env

# Asegurar que REACT_APP_API_URL apunta correctamente
REACT_APP_API_URL=http://localhost:8000

# Verificar CORS en backend/BGProject/settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
    "http://localhost:8080",
]
```

### WebSockets no funcionan

```bash
# Verificar que Daphne está ejecutándose
docker-compose logs backend | grep -i daphne

# Verificar Redis está corriendo
docker-compose ps redis

# Verificar configuración de Channels
docker-compose exec backend python manage.py shell
>>> from channels.layers import get_channel_layer
>>> channel_layer = get_channel_layer()
>>> channel_layer  # Debe retornar objeto RedisChannelLayer
```

### Problemas con MQTT

```bash
# Verificar Mosquitto está corriendo
docker-compose ps mosquitto

# Probar conexión MQTT
docker-compose exec mosquitto mosquitto_pub -t test -m "hello"
docker-compose exec mosquitto mosquitto_sub -t test

# Verificar logs
docker-compose logs mosquitto
```

### Error de permisos en archivos

```bash
# Puede ocurrir con volúmenes Docker
# Cambiar propietario de archivos
sudo chown -R $USER:$USER .

# O ejecutar comandos con usuario adecuado
docker-compose exec --user $(id -u):$(id -g) backend bash
```

### Base de datos corrupta

```bash
# Resetear base de datos (⚠️ elimina todos los datos)
docker-compose down -v
docker-compose up -d db
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py createsuperuser
```

---

## Recursos Adicionales

### Documentación Oficial

- [Django](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [React](https://react.dev/)
- [Docker](https://docs.docker.com/)
- [Redis](https://redis.io/docs/)
- [MQTT](https://mqtt.org/)

### Herramientas Útiles

- **Postman/Insomnia:** Testing de API
- **Redis Commander:** GUI para Redis
- **MQTT Explorer:** GUI para MQTT
- **pgAdmin:** GUI para PostgreSQL
- **VS Code:** Editor recomendado con extensiones:
  - Python
  - ESLint
  - Prettier
  - Docker
  - GitLens

---

## Contacto

Para preguntas o problemas:
- **Issues GitHub:** https://github.com/CharFranR/Biogestor/issues
- **Email:** equipo@biogestor.com

---

**Última actualización:** 2025-01-15  
**Versión:** 2.0  
**Mantenedores:** Equipo Biogestor ULSA
