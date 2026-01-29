# Backend del Sistema Biogestor

API REST para la gestión y monitoreo de biodigestores. Desarrollado con Django, Django REST Framework, Channels y soporte MQTT para datos en tiempo real.

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Arquitectura del Sistema](#arquitectura-del-sistema)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Requisitos e Instalación](#requisitos-e-instalación)
- [Configuración](#configuración)
- [Aplicaciones del Backend](#aplicaciones-del-backend)
  - [BatchModel](#batchmodel)
  - [calibrations](#calibrations)
  - [dataSensor](#datasensor)
  - [Fill](#fill)
  - [inventario](#inventario)
- [API REST - Endpoints](#api-rest---endpoints)
- [WebSockets](#websockets)
- [MQTT](#mqtt)
- [Base de Datos](#base-de-datos)
- [Testing](#testing)
- [Despliegue](#despliegue)

---

## Descripción General

El backend del Sistema Biogestor es una aplicación Django que proporciona:

- **APIs REST** para gestión de datos de sensores, llenados, calibraciones e inventario
- **Modelo matemático** para predicción de producción de biogás basado en el modelo de Gompertz
- **Integración MQTT** para recepción de datos en tiempo real desde sensores IoT
- **WebSockets** para transmisión de datos en tiempo real al frontend
- **Generación de reportes PDF** para inventario

---

## Arquitectura del Sistema

```
┌─────────────────┐     ┌──────────────────────────────────────────────┐
│                 │     │            Backend Django                     │
│   Frontend      │◄───►│  ┌─────────────┐    ┌──────────────────────┐ │
│   React App     │     │  │  REST API   │    │  WebSocket Server    │ │
│                 │     │  │  (DRF)      │    │  (Channels)          │ │
└─────────────────┘     │  └─────────────┘    └──────────────────────┘ │
                        │         │                    ▲                │
                        │         ▼                    │                │
                        │  ┌─────────────┐    ┌──────────────────────┐ │
                        │  │  PostgreSQL │    │       Redis          │ │
                        │  │  (Database) │    │   (Cache/Channel)    │ │
                        │  └─────────────┘    └──────────────────────┘ │
                        └──────────────────────────────────────────────┘
                                                       ▲
                                                       │
                        ┌──────────────────────────────┴───────────────┐
                        │               MQTT Broker                     │
                        │              (Mosquitto)                      │
                        └───────────────────┬──────────────────────────┘
                                            │
                        ┌───────────────────▼──────────────────────────┐
                        │            Sensores IoT                       │
                        │   (Temperatura, pH, Presión, etc.)           │
                        └──────────────────────────────────────────────┘
```

---

## Estructura del Proyecto

```
backend/
├── manage.py                 # Punto de entrada Django
├── requirements.txt          # Dependencias Python
├── Dockerfile               # Configuración Docker
├── BGProject/               # Configuración principal del proyecto
│   ├── settings.py          # Configuración Django
│   ├── urls.py              # URLs principales
│   ├── asgi.py              # Configuración ASGI (WebSockets)
│   └── wsgi.py              # Configuración WSGI
├── BatchModel/              # Modelo matemático de producción
├── calibrations/            # Gestión de calibraciones de sensores
├── dataSensor/              # Gestión de sensores y datos
├── Fill/                    # Gestión de llenados del biodigestor
└── inventario/              # Gestión de inventario
```

---

## Requisitos e Instalación

### Requisitos Previos

- Python 3.10+
- PostgreSQL 16
- Redis 7+
- Docker y Docker Compose (recomendado)

### Dependencias Principales

| Dependencia | Versión | Descripción |
|-------------|---------|-------------|
| Django | Latest | Framework web principal |
| djangorestframework | Latest | API REST |
| channels | Latest | WebSockets |
| daphne | Latest | Servidor ASGI |
| paho-mqtt | Latest | Cliente MQTT |
| psycopg2-binary | Latest | Driver PostgreSQL |
| redis | Latest | Cliente Redis |
| channels_redis | Latest | Backend Redis para Channels |
| reportlab | Latest | Generación de PDFs |
| pandas | Latest | Análisis de datos |
| numpy | Latest | Cálculos numéricos |

### Instalación con Docker (Recomendado)

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto levantará todos los servicios:
- Backend Django (puerto 8000)
- PostgreSQL (puerto 5432)
- Redis (puerto 6379)
- Mosquitto MQTT (puerto 1883)
- Nginx (puerto 8080)

### Instalación Manual

```bash
# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# o
.\venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env  # Editar según configuración

# Ejecutar migraciones
python manage.py migrate

# Iniciar servidor de desarrollo
python manage.py runserver

# O con Daphne (soporte WebSocket)
daphne -b 0.0.0.0 -p 8000 BGProject.asgi:application
```

---

## Configuración

### Variables de Entorno

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `DJANGO_SECRET_KEY` | Clave secreta Django | Auto-generada en desarrollo |
| `DEBUG` | Modo debug | `true` |
| `DATABASE_URL` | URL de conexión PostgreSQL | - |
| `REDIS_URL` | URL de conexión Redis | `redis://redis:6379/0` |

### Configuración de Base de Datos (settings.py)

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'appdb',
        'USER': 'postgres',
        'PASSWORD': 'postgres',
        'HOST': 'db',
        'PORT': '5432',
    }
}
```

---

## Aplicaciones del Backend

### BatchModel

Aplicación para el modelo matemático de predicción de producción de biogás.

#### Modelo de Datos

**BasicParams** - Parámetros básicos de materiales de alimentación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `supplyName` | CharField(200) | Nombre del material |
| `TS` | FloatField | Sólidos totales (%) |
| `VSTS` | FloatField | Sólidos volátiles / Sólidos totales (ratio) |
| `potencial_production` | FloatField | Producción potencial (m³/kg VS) |

#### Modelo Matemático

El sistema utiliza el **modelo de Gompertz modificado** para predecir la producción de biogás:

```
Y(t) = P × exp(-b × exp(-c × t))
```

Donde:
- `Y(t)` = Producción acumulada de biogás en el tiempo t
- `P` = Producción potencial máxima
- `b` = Factor de forma (función del tiempo de retardo)
- `c` = Tasa de crecimiento específica

**Funciones principales (`mathModel.py`):**

| Función | Descripción |
|---------|-------------|
| `get_total_solids()` | Calcula sólidos totales basado en masa y humedad |
| `get_total_volatile_solids()` | Calcula sólidos volátiles |
| `get_potencial_production()` | Calcula producción potencial de biogás |
| `get_max_mu()` | Calcula tasa de crecimiento máxima (dependiente de temperatura) |
| `get_solvent_volume()` | Calcula volumen del solvente |
| `get_initial_concentration()` | Calcula concentración inicial |
| `get_specific_mu()` | Calcula tasa de crecimiento específica (cinética Monod) |
| `get_cumulative_gompertz()` | Producción acumulada (modelo Gompertz) |
| `get_derivative_gompertz()` | Producción diaria (derivada del modelo) |
| `simulation()` | Ejecuta simulación completa |

#### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/BasicParams/` | Lista todos los parámetros |
| POST | `/api/BasicParams/` | Crea nuevo parámetro |
| GET | `/api/BasicParams/{id}/` | Obtiene parámetro por ID |
| PUT | `/api/BasicParams/{id}/` | Actualiza parámetro |
| DELETE | `/api/BasicParams/{id}/` | Elimina parámetro |
| POST | `/api/calculation/` | Ejecuta simulación de producción |

#### Ejemplo de uso - Simulación

```bash
curl -X POST http://localhost:8000/api/calculation/ \
  -H "Content-Type: application/json" \
  -d '{
    "filling_mass": 100,
    "approx_density": 1.05,
    "added_watter": 50,
    "type_material": "Estiércol bovino",
    "filling_moisture": 80,
    "delay_time": 5,
    "temperature": 35
  }'
```

**Respuesta:**
```json
{
  "total_solids": 20.0,
  "total_volatile_solids": 16.0,
  "potencial_production": 4.8,
  "max_mu": 0.334,
  "solvent_volume": 142.857,
  "initial_concentration": 0.112,
  "specific_mu": 0.167,
  "cumulative_production": [0.001, 0.003, 0.008, "..."],
  "derivative_production": [0.001, 0.002, 0.005, "..."]
}
```

---

### calibrations

Aplicación para gestionar las calibraciones de sensores.

#### Modelo de Datos

**Calibration** - Registro de calibraciones

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `userId` | FloatField | ID del usuario que realizó la calibración |
| `sensorId` | FloatField | ID del sensor calibrado |
| `date` | DateField | Fecha de calibración (auto) |
| `params` | CharField(200) | Parámetros de calibración |
| `note` | TextField | Notas adicionales |
| `result` | TextField | Resultado de la calibración |
| `previous_calibration` | DateField | Fecha de calibración anterior |

#### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/calibration/` | Lista todas las calibraciones |
| POST | `/api/calibration/` | Crea nueva calibración |
| GET | `/api/calibration/{id}/` | Obtiene calibración por ID |
| PUT | `/api/calibration/{id}/` | Actualiza calibración |
| DELETE | `/api/calibration/{id}/` | Elimina calibración |

#### Ejemplo de uso

```bash
# Crear calibración
curl -X POST http://localhost:8000/api/calibration/ \
  -H "Content-Type: application/json" \
  -d '{
    "userId": 1,
    "sensorId": 1,
    "params": "offset: 0.5, gain: 1.02",
    "note": "Calibración de rutina",
    "result": "OK - Dentro de tolerancia",
    "previous_calibration": "2025-12-01"
  }'
```

---

### dataSensor

Aplicación central para la gestión de sensores y datos en tiempo real.

#### Modelo de Datos

**MeasuredVariable** - Variables físicas medidas

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(200) | Nombre de la variable (ej: Temperatura, pH) |

**Sensor** - Configuración de sensores

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(200) | Nombre del sensor |
| `mqtt_code` | CharField(20) | Código MQTT para suscripción |
| `measured_variable` | FK(MeasuredVariable) | Variable que mide |
| `suscription_date` | DateField | Fecha de registro |
| `min_range` | FloatField | Rango mínimo de medición |
| `max_range` | FloatField | Rango máximo de medición |
| `hysteresis` | FloatField (opcional) | Histéresis (%) |
| `accuracy` | FloatField (opcional) | Exactitud (%) |
| `precision` | FloatField (opcional) | Precisión (%) |

**Data** - Lecturas de sensores

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `sensor` | FK(Sensor) | Sensor que generó la lectura |
| `value` | FloatField | Valor medido |
| `date` | DateTimeField | Timestamp (auto) |
| `fill` | FK(Fill) (opcional) | Llenado asociado |

#### Flujo de Datos MQTT

```
Sensor IoT → MQTT Broker → MqttSub.py → Redis → WebSocket → Frontend
                                    ↓
                              PostgreSQL (cada 5 seg)
```

1. El sensor publica en el topic `Biogestor/{mqtt_code}`
2. `MqttSub.py` recibe el mensaje y lo almacena en Redis
3. Se notifica al frontend vía WebSocket
4. Un thread en segundo plano persiste los últimos valores cada 5 segundos

#### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/measuredVariables/` | Lista variables medidas |
| POST | `/api/measuredVariables/` | Crea variable medida |
| GET | `/api/sensors/` | Lista todos los sensores |
| POST | `/api/sensors/` | Crea nuevo sensor |
| GET | `/api/sensors/{id}/` | Obtiene sensor por ID |
| PUT | `/api/sensors/{id}/` | Actualiza sensor |
| DELETE | `/api/sensors/{id}/` | Elimina sensor |
| GET | `/api/sensor-data/` | Lista todas las lecturas |
| POST | `/api/sensor-data/` | Crea lectura manual |
| GET | `/api/sensor-data/{id}/` | Obtiene lectura por ID |

#### Ejemplo de uso

```bash
# Crear sensor
curl -X POST http://localhost:8000/api/sensors/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Sensor Temperatura 1",
    "mqtt_code": "temp01",
    "measured_variable": 1,
    "min_range": 0,
    "max_range": 100,
    "accuracy": 0.5,
    "precision": 0.1
  }'

# Obtener datos de sensor
curl http://localhost:8000/api/sensor-data/?sensor=1
```

---

### Fill

Aplicación para gestionar los llenados del biodigestor.

#### Modelo de Datos

**FillPrediction** - Predicciones de producción para un llenado

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `total_solids` | FloatField | Sólidos totales calculados |
| `total_volatile_solids` | FloatField | Sólidos volátiles totales |
| `potencial_production` | FloatField | Producción potencial (m³) |
| `max_mu` | FloatField | Tasa de crecimiento máxima |
| `solvent_volume` | FloatField | Volumen del solvente |
| `initial_concentration` | FloatField | Concentración inicial |
| `specific_mu` | FloatField | Tasa de crecimiento específica |
| `cumulative_production` | JSONField | Array de producción acumulada diaria |
| `derivative_production` | JSONField | Array de producción diaria |

**Fill** - Registro de llenados

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `first_day` | DateField | Fecha de inicio (auto) |
| `last_day` | DateField (opcional) | Fecha de fin |
| `people_involved` | TextField (opcional) | Personal involucrado |
| `filling_mass` | FloatField | Masa de material (kg) |
| `approx_density` | FloatField | Densidad aproximada (kg/L) |
| `added_watter` | FloatField | Agua añadida (L) |
| `type_material` | FloatField | ID del tipo de material |
| `filling_moisture` | FloatField | Humedad del material (%) |
| `delay_time` | FloatField | Tiempo de retardo (días) |
| `prediction` | FK(FillPrediction) | Predicción asociada |

#### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/Fill/` | Lista todos los llenados |
| POST | `/api/Fill/` | Crea nuevo llenado (genera predicción automáticamente) |
| GET | `/api/Fill/{id}/` | Obtiene llenado por ID |
| PUT | `/api/Fill/{id}/` | Actualiza llenado |
| DELETE | `/api/Fill/{id}/` | Elimina llenado |
| POST | `/api/Fill/{id}/end_fill/` | Finaliza llenado activo |

#### Ejemplo de uso

```bash
# Crear nuevo llenado
curl -X POST http://localhost:8000/api/Fill/ \
  -H "Content-Type: application/json" \
  -d '{
    "filling_mass": 150,
    "approx_density": 1.02,
    "added_watter": 75,
    "type_material": 1,
    "filling_moisture": 75,
    "delay_time": 3,
    "people_involved": "Juan Pérez, María García"
  }'

# Finalizar llenado activo
curl -X POST http://localhost:8000/api/Fill/1/end_fill/
```

---

### inventario

Aplicación para gestionar el inventario de materiales y equipos.

#### Modelo de Datos

**place** - Ubicaciones/áreas del CIDTEA

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(200) | Nombre del área |

**items** - Ítems del inventario

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `name` | CharField(200) | Nombre del ítem |
| `quantity` | IntegerField | Cantidad disponible |
| `place` | FK(place) | Ubicación del ítem |

#### Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/items/` | Lista todos los ítems |
| POST | `/api/items/` | Crea nuevo ítem |
| GET | `/api/items/{id}/` | Obtiene ítem por ID |
| PUT | `/api/items/{id}/` | Actualiza ítem |
| DELETE | `/api/items/{id}/` | Elimina ítem |
| GET | `/api/place/` | Lista todas las ubicaciones |
| POST | `/api/place/` | Crea nueva ubicación |
| GET | `/api/place/{id}/` | Obtiene ubicación por ID |
| PUT | `/api/place/{id}/` | Actualiza ubicación |
| DELETE | `/api/place/{id}/` | Elimina ubicación |
| POST | `/api/place/{id}/generate_report/` | Genera reporte PDF del inventario |

#### Generación de Reportes PDF

La acción `generate_report` genera un PDF con el inventario de un área específica:

```bash
# Generar reporte del área con ID 1
curl -X POST http://localhost:8000/api/place/1/generate_report/ \
  --output reporte_inventario.pdf
```

El reporte incluye:
- Encabezado con fecha y área
- Tabla con nombre, cantidad y ubicación de cada ítem
- Total de cantidades
- Pie de página

---

## API REST - Endpoints

### Resumen de todos los endpoints

| App | Endpoint | Métodos | Descripción |
|-----|----------|---------|-------------|
| BatchModel | `/api/BasicParams/` | GET, POST | Parámetros de materiales |
| BatchModel | `/api/BasicParams/{id}/` | GET, PUT, DELETE | CRUD parámetro |
| BatchModel | `/api/calculation/` | POST | Simulación de producción |
| calibrations | `/api/calibration/` | GET, POST | Calibraciones |
| calibrations | `/api/calibration/{id}/` | GET, PUT, DELETE | CRUD calibración |
| dataSensor | `/api/measuredVariables/` | GET, POST | Variables medidas |
| dataSensor | `/api/sensors/` | GET, POST | Sensores |
| dataSensor | `/api/sensors/{id}/` | GET, PUT, DELETE | CRUD sensor |
| dataSensor | `/api/sensor-data/` | GET, POST | Lecturas de sensores |
| Fill | `/api/Fill/` | GET, POST | Llenados |
| Fill | `/api/Fill/{id}/` | GET, PUT, DELETE | CRUD llenado |
| Fill | `/api/Fill/{id}/end_fill/` | POST | Finalizar llenado |
| inventario | `/api/items/` | GET, POST | Ítems inventario |
| inventario | `/api/items/{id}/` | GET, PUT, DELETE | CRUD ítem |
| inventario | `/api/place/` | GET, POST | Ubicaciones |
| inventario | `/api/place/{id}/` | GET, PUT, DELETE | CRUD ubicación |
| inventario | `/api/place/{id}/generate_report/` | POST | Generar PDF |

---

## WebSockets

### Conexión

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/dataSensor/');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Datos de sensores:', data);
};
```

### Formato de mensajes

```json
{
  "Biogestor/temp01": ["25.5", "25.6", "25.4"],
  "Biogestor/ph01": ["7.2", "7.1", "7.2"],
  "Biogestor/pres01": ["1.02", "1.03", "1.02"]
}
```

Cada clave corresponde al topic MQTT del sensor y el valor es un array con las últimas 30 lecturas almacenadas en Redis.

---

## MQTT

### Configuración del Broker

El broker Mosquitto está configurado en el puerto 1883.

### Topics

Los sensores publican en el formato: `Biogestor/{mqtt_code}`

Ejemplo:
- `Biogestor/temp01` - Sensor de temperatura 1
- `Biogestor/ph01` - Sensor de pH 1
- `Biogestor/pres01` - Sensor de presión 1

### Simulador de Sensores

El proyecto incluye un simulador MQTT en `scripts/mqtt_simulator.py` para pruebas.

```bash
python scripts/mqtt_simulator.py
```

---

## Base de Datos

### Diagrama ER Simplificado

```
┌─────────────────┐     ┌─────────────────┐
│   BasicParams   │     │ MeasuredVariable│
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ supplyName      │     │ name            │
│ TS              │     └────────┬────────┘
│ VSTS            │              │
│ potencial_prod  │              │
└─────────────────┘              │
                                 │
┌─────────────────┐     ┌────────▼────────┐     ┌─────────────────┐
│ FillPrediction  │     │     Sensor      │     │   Calibration   │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │     │ id              │
│ total_solids    │     │ name            │     │ userId          │
│ total_vol_sol   │     │ mqtt_code       │     │ sensorId        │
│ potencial_prod  │     │ measured_var FK │     │ date            │
│ max_mu          │     │ suscription_dt  │     │ params          │
│ solvent_volume  │     │ min_range       │     │ note            │
│ initial_conc    │     │ max_range       │     │ result          │
│ specific_mu     │     │ hysteresis      │     │ prev_calibration│
│ cumulative_prod │     │ accuracy        │     └─────────────────┘
│ derivative_prod │     │ precision       │
└────────┬────────┘     └────────┬────────┘
         │                       │
         │                       │
┌────────▼────────┐     ┌────────▼────────┐
│      Fill       │◄────│      Data       │
├─────────────────┤     ├─────────────────┤
│ id              │     │ id              │
│ first_day       │     │ sensor FK       │
│ last_day        │     │ value           │
│ people_involved │     │ date            │
│ filling_mass    │     │ fill FK         │
│ approx_density  │     └─────────────────┘
│ added_watter    │
│ type_material   │
│ filling_moist   │
│ delay_time      │
│ prediction FK   │
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│      place      │     │      items      │
├─────────────────┤     ├─────────────────┤
│ id              │◄────│ id              │
│ name            │     │ name            │
└─────────────────┘     │ quantity        │
                        │ place FK        │
                        └─────────────────┘
```

---

## Testing

### Ejecutar Tests

```bash
# Todos los tests
pytest

# Tests de una app específica
pytest BatchModel/
pytest dataSensor/
pytest Fill/
pytest calibrations/
pytest inventario/

# Con cobertura
pytest --cov=.
```

### Archivos de Test

- `BatchModel/test_BatchModel.py`
- `calibrations/test_calibrations.py`
- `dataSensor/test_dataSensor.py`
- `Fill/test_Fill.py`
- `inventario/tests.py`

---

## Despliegue

### Producción con Docker Compose

```bash
# Construir y levantar
docker-compose up -d --build

# Ver logs
docker-compose logs -f backend

# Parar servicios
docker-compose down
```

### Servicios Docker

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| backend | 8000 | Django + Daphne |
| db | 5432 | PostgreSQL |
| redis | 6379 | Redis |
| mosquitto | 1883 | MQTT Broker |
| nginx | 8080 | Proxy reverso |
| frontend | 8090 | React App |
| mqtt_subscriber | - | Suscriptor MQTT |

### Health Check

El endpoint `/healthz/` verifica:
- Estado del proceso Django
- Conectividad con la base de datos

```bash
curl http://localhost:8000/healthz/
# {"status": "ok", "database": true}
```

---

## Solución de Problemas

### Problemas comunes

**Error de conexión a PostgreSQL:**
```bash
# Verificar que el contenedor está corriendo
docker ps | grep postgres

# Ver logs
docker logs postgres_db
```

**Error de conexión Redis:**
```bash
# Verificar servicio
docker logs redis

# Probar conexión
redis-cli -h localhost -p 6379 ping
```

**WebSocket no conecta:**
- Verificar que Daphne está corriendo (no runserver)
- Verificar configuración ASGI en settings
- Revisar CORS si el frontend está en otro dominio

**MQTT no recibe datos:**
```bash
# Ver logs del suscriptor
docker logs mqtt_subscriber

# Probar publicación manual
mosquitto_pub -h localhost -p 1883 -t "Biogestor/temp01" -m "25.5"
```

---

## Licencia

Este proyecto es parte del sistema de monitoreo de biodigestores del CIDTEA.

---

*Documentación generada el 29 de enero de 2026*
