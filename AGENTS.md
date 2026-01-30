# AGENTS.md - Guía para Agentes de IA

Este archivo proporciona contexto y directrices para que agentes de IA (como GitHub Copilot, Claude, GPT, etc.) puedan comprender y trabajar efectivamente con el proyecto Sistema Biogestor.

## 📋 Descripción del Proyecto

**Sistema Biogestor** es una aplicación web para la gestión y monitoreo de biodigestores en el CIDTEA. El sistema permite:

- Monitorear datos de sensores en tiempo real (temperatura, pH, presión)
- Predecir la producción de biogás usando el modelo matemático de Gompertz
- Gestionar llenados del biodigestor con sus respectivas predicciones
- Registrar calibraciones de sensores
- Administrar inventario de materiales y equipos
- Generar reportes PDF

---

## 🏗️ Arquitectura General

```
proyecto/
├── backend/          # Django REST Framework + Channels
├── frontend/         # (En desarrollo - será reemplazado)
├── Docs/            # Documentación
├── scripts/         # Utilidades (simulador MQTT)
├── mosquitto/       # Configuración broker MQTT
├── docker-compose.yml
└── nginx.conf
```

---

## 🔧 Stack Tecnológico del Backend

| Tecnología | Propósito |
|------------|-----------|
| Django 4.2+ | Framework web principal |
| Django REST Framework | API REST |
| Django Channels | WebSockets |
| Daphne | Servidor ASGI |
| PostgreSQL 16 | Base de datos |
| Redis 7 | Cache y channel layer |
| Mosquitto | Broker MQTT |
| paho-mqtt | Cliente MQTT Python |
| reportlab | Generación de PDFs |
| pandas/numpy | Cálculos numéricos |

---

## 📁 Estructura del Backend

```
backend/
├── BGProject/           # Configuración principal Django
│   ├── settings.py      # Configuración
│   ├── urls.py          # URLs raíz
│   ├── asgi.py          # Config ASGI para WebSockets
│   └── wsgi.py          # Config WSGI
│
├── BatchModel/          # App: Modelo matemático de producción
│   ├── models.py        # BasicParams
│   ├── mathModel.py     # Funciones de cálculo (Gompertz)
│   ├── views.py         # BasicParamsViewSet, mathModelAPI
│   ├── serializers.py   # BasicParamsSerializer, BatchModelSerializer
│   └── urls.py          # /api/BasicParams/, /api/calculation/
│
├── calibrations/        # App: Calibraciones de sensores
│   ├── models.py        # Calibration
│   ├── views.py         # CalibrationViewSet
│   ├── serializers.py   # CalibrationSerializer
│   └── urls.py          # /api/calibration/
│
├── dataSensor/          # App: Sensores y datos en tiempo real
│   ├── models.py        # MeasuredVariable, Sensor, Data
│   ├── views.py         # ViewSets + lógica de guardado
│   ├── serializers.py   # Serializers
│   ├── consumers.py     # WebSocket consumer
│   ├── MqttSub.py       # Suscriptor MQTT
│   ├── websocketService.py # Envío de datos a WebSocket
│   ├── routing.py       # URLs WebSocket
│   └── urls.py          # /api/sensors/, /api/sensor-data/
│
├── Fill/                # App: Gestión de llenados
│   ├── models.py        # Fill, FillPrediction
│   ├── views.py         # FillViewSet con end_fill action
│   ├── serializers.py   # Serializers (auto-genera predicción)
│   └── urls.py          # /api/Fill/
│
├── inventario/          # App: Inventario
│   ├── models.py        # place, items
│   ├── views.py         # ViewSets + generate_report action
│   ├── serializers.py   # Serializers
│   └── urls.py          # /api/items/, /api/place/
│
├── authentication/      # App: Autenticación (NO MODIFICAR SIN CONTEXTO)
├── usuarios/            # App: Usuarios (NO MODIFICAR SIN CONTEXTO)
│
├── manage.py
├── requirements.txt
└── Dockerfile
```

---

## 🔌 Endpoints API

### BatchModel
- `GET/POST /api/BasicParams/` - CRUD parámetros de materiales
- `POST /api/calculation/` - Ejecutar simulación de producción

### calibrations
- `GET/POST/PUT/DELETE /api/calibration/` - CRUD calibraciones

### dataSensor
- `GET/POST /api/measuredVariables/` - Variables medidas
- `GET/POST/PUT/DELETE /api/sensors/` - CRUD sensores
- `GET/POST /api/sensor-data/` - Lecturas de sensores

### Fill
- `GET/POST/PUT/DELETE /api/Fill/` - CRUD llenados
- `POST /api/Fill/{id}/end_fill/` - Finalizar llenado activo

### inventario
- `GET/POST/PUT/DELETE /api/items/` - CRUD ítems
- `GET/POST/PUT/DELETE /api/place/` - CRUD ubicaciones
- `POST /api/place/{id}/generate_report/` - Generar PDF

### authentication
- `POST /api/auth/register/` - Registrar usuario
- `POST /api/auth/login/` - Iniciar sesión (JWT)
- `POST /api/auth/refresh/` - Refrescar JWT
- `POST /api/auth/logout/` - Cerrar sesión (blacklist refresh)
- `GET /api/users/` - Listar usuarios aprobados (superusuario)
- `GET /api/users/pending/` - Listar usuarios pendientes (superusuario)
- `GET /api/users/me/` - Usuario actual
- `POST /api/users/{id}/approve/` - Aprobar usuario (superusuario)
- `GET/POST /api/users/{id}/permissions/` - Ver/actualizar permisos (superusuario para POST)
- `POST /api/users/{id}/role/` - Cambiar rol (superusuario)

---

## 📊 Modelos de Datos Principales

### BasicParams (BatchModel)
```python
class BasicParams(models.Model):
    supplyName = models.CharField(max_length=200)  # Nombre del material
    TS = models.FloatField()  # Sólidos totales (%)
    VSTS = models.FloatField()  # Sólidos volátiles / Sólidos totales
    potencial_production = models.FloatField()  # m³/kg VS
```

### Sensor (dataSensor)
```python
class Sensor(models.Model):
    name = models.CharField(max_length=200)
    mqtt_code = models.CharField(max_length=20)  # Topic MQTT: Biogestor/{mqtt_code}
    measured_variable = models.ForeignKey(MeasuredVariable, on_delete=models.CASCADE)
    suscription_date = models.DateField(auto_now_add=True)
    min_range = models.FloatField()
    max_range = models.FloatField()
    hysteresis = models.FloatField(null=True, blank=True)
    accuracy = models.FloatField(null=True, blank=True)
    precision = models.FloatField(null=True, blank=True)
```

### Fill
```python
class Fill(models.Model):
    first_day = models.DateField(auto_now_add=True)
    last_day = models.DateField(null=True, blank=True)
    people_involved = models.TextField(null=True, blank=True)
    filling_mass = models.FloatField()  # kg
    approx_density = models.FloatField()  # kg/L
    added_watter = models.FloatField()  # L
    type_material = models.FloatField()  # ID de BasicParams
    filling_moisture = models.FloatField()  # %
    delay_time = models.FloatField()  # días
    prediction = models.ForeignKey(FillPrediction, on_delete=models.CASCADE, null=True)
```

---

## 🧮 Modelo Matemático (Gompertz)

El sistema utiliza el **modelo de Gompertz modificado** para predecir producción de biogás:

```
Y(t) = P × exp(-b × exp(-c × t))
```

**Funciones principales en `mathModel.py`:**

| Función | Descripción |
|---------|-------------|
| `get_total_solids()` | Calcula sólidos totales |
| `get_total_volatile_solids()` | Calcula sólidos volátiles |
| `get_potencial_production()` | Producción potencial de biogás |
| `get_max_mu()` | Tasa de crecimiento máxima (f(temperatura)) |
| `get_specific_mu()` | Tasa específica (cinética Monod) |
| `get_cumulative_gompertz()` | Producción acumulada |
| `get_derivative_gompertz()` | Producción diaria |
| `simulation()` | Ejecuta simulación completa |

---

## ⚡ Flujo de Datos en Tiempo Real

```
Sensor IoT
    ↓ (publica en Biogestor/{mqtt_code})
MQTT Broker (Mosquitto:1883)
    ↓
MqttSub.py (suscriptor)
    ↓ (almacena últimos 30 valores)
Redis
    ↓
websocketService.py → WebSocket → Frontend
    ↓ (cada 5 segundos)
PostgreSQL (persistencia)
```

---

## 🐳 Docker Compose

Servicios disponibles:
- `backend` - Django + Daphne (puerto 8000)
- `db` - PostgreSQL (puerto 5432)
- `redis` - Redis (puerto 6379)
- `mosquitto` - MQTT Broker (puerto 1883)
- `nginx` - Proxy reverso (puerto 8080)
- `mqtt_subscriber` - Suscriptor MQTT

---

## 🧪 Testing

```bash
# Ejecutar todos los tests
pytest

# Tests por app
pytest BatchModel/
pytest dataSensor/
pytest Fill/
pytest calibrations/
pytest inventario/
pytest authentication/

# Con cobertura
pytest --cov=.
```

---

## 📝 Directrices para Agentes de IA

### Al modificar código:

1. **No modificar** las apps `authentication` y `usuarios` sin contexto explícito
2. **Mantener** la estructura de ViewSets de DRF existente
3. **Usar** los serializers para validación de datos
4. **Respetar** las relaciones de ForeignKey existentes
5. **Seguir** el patrón de URLs con routers de DRF

### Al agregar nuevas funcionalidades:

1. Crear una nueva app Django si es una funcionalidad independiente
2. Registrar la app en `INSTALLED_APPS` de `settings.py`
3. Incluir las URLs en `BGProject/urls.py`
4. Documentar los nuevos endpoints
5. Agregar tests en el archivo `test_*.py` de la app

### Al trabajar con MQTT/WebSockets:

1. Los sensores publican en `Biogestor/{mqtt_code}`
2. Redis almacena los últimos 30 valores por sensor
3. El WebSocket está en `ws://host/ws/dataSensor/`
4. Los datos se persisten cada 5 segundos (configurable en `save_time`)

### Convenciones de código:

- Nombres de modelos: PascalCase
- Nombres de campos: snake_case
- ViewSets: `{Model}ViewSet`
- Serializers: `{Model}Serializer`
- URLs: kebab-case o camelCase según el modelo

---

## ⚠️ Notas Importantes

1. **El frontend será reemplazado** - No invertir esfuerzo en el frontend actual
2. **Base de datos PostgreSQL** - No usar SQLite en producción
3. **Redis requerido** - Para WebSockets y cache de MQTT
4. **Daphne obligatorio** - Para soporte de WebSockets (no usar runserver)
5. **El simulador MQTT** está en `scripts/mqtt_simulator.py` para pruebas

---

## 🔗 Archivos Clave

| Archivo | Propósito |
|---------|-----------|
| `BGProject/settings.py` | Configuración Django |
| `BGProject/urls.py` | Rutas API principales |
| `dataSensor/MqttSub.py` | Suscriptor MQTT |
| `dataSensor/consumers.py` | WebSocket consumer |
| `BatchModel/mathModel.py` | Modelo matemático |
| `docker-compose.yml` | Orquestación de servicios |
| `requirements.txt` | Dependencias Python |

---

*Última actualización: 29 de enero de 2026*
