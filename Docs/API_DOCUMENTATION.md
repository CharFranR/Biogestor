# Documentación de API - Biogestor

## Introducción

Esta documentación describe todos los endpoints REST disponibles en el sistema Biogestor. La API está construida con Django REST Framework y soporta operaciones CRUD completas.

**Base URL:** `http://localhost:8000/api/`

**Autenticación:** JWT (JSON Web Tokens)

## Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Usuarios](#usuarios)
3. [Dashboard](#dashboard)
4. [Llenados (FillingStages)](#llenados)
5. [Reportes](#reportes)
6. [Sensores](#sensores)
7. [Dispositivos IoT](#dispositivos-iot)
8. [Actuadores](#actuadores)
9. [Alertas](#alertas)
10. [Calibraciones](#calibraciones)
11. [WebSockets](#websockets)

---

## Autenticación

### Registro de Usuario

**POST** `/api/usuarios/crear/`

Registra un nuevo usuario en el sistema.

**Request Body:**
```json
{
  "username": "usuario123",
  "email": "usuario@example.com",
  "password": "contraseña_segura",
  "first_name": "Juan",
  "last_name": "Pérez"
}
```

**Response:** 201 Created
```json
{
  "mensaje": "Usuario registrado exitosamente. Espera aprobación del administrador.",
  "usuario": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "first_name": "Juan",
    "last_name": "Pérez"
  }
}
```

### Iniciar Sesión

**POST** `/api/usuarios/login/`

Autentica un usuario y retorna tokens JWT.

**Request Body:**
```json
{
  "username": "usuario123",
  "password": "contraseña_segura"
}
```

**Response:** 200 OK
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "usuario123",
    "email": "usuario@example.com",
    "perfil": {
      "aprobado": true,
      "rol": "COLAB"
    }
  }
}
```

### Cerrar Sesión

**POST** `/api/usuarios/logout/`

Invalida el refresh token.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response:** 200 OK
```json
{
  "mensaje": "Sesión cerrada exitosamente"
}
```

---

## Usuarios

### Listar Usuarios

**GET** `/api/usuarios/usuarios/`

Lista todos los usuarios (solo administradores).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "username": "admin",
    "email": "admin@biogestor.com",
    "first_name": "Administrador",
    "last_name": "Sistema",
    "perfil": {
      "aprobado": true,
      "rol": "ADMIN"
    }
  }
]
```

### Obtener Usuario Actual

**GET** `/api/usuarios/usuarios/me/`

Obtiene información del usuario autenticado.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "id": 2,
  "username": "usuario123",
  "email": "usuario@example.com",
  "perfil": {
    "id": 2,
    "aprobado": true,
    "rol": "COLAB",
    "rol_display": "Colaborador"
  },
  "permisos": {
    "VerDashboard": true,
    "GenerarReportes": true,
    "VerReportes": true,
    "VerCalibraciones": false,
    "ModificarInventario": false
  }
}
```

### Aprobar Usuario

**POST** `/api/usuarios/perfiles/{id}/approve/`

Aprueba un usuario pendiente (solo administradores).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "detail": "Usuario usuario123 aprobado exitosamente",
  "perfil_id": 2
}
```

---

## Dashboard

### Estadísticas del Dashboard

**GET** `/api/dashboard/stats/`

Obtiene métricas generales del sistema.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "etapas_activas": 1,
  "reportes_generados": 15,
  "lecturas_hoy": 234
}
```

### Producción Actual

**GET** `/api/dashboard/production/current/`

Obtiene datos de producción de biogás para la etapa activa.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "stage": {
    "id": 5,
    "number": 5,
    "date": "2025-01-10",
    "material_type": "bovino",
    "material_amount_kg": 50.0,
    "temperature_c": 32.0
  },
  "expected": {
    "days": [0, 1, 2, 3, ...],
    "daily_biogas_m3": [0.1, 0.5, 1.2, ...],
    "cumulative_biogas_m3": [0.1, 0.6, 1.8, ...],
    "A_biogas_m3": 15.5
  },
  "actual": {
    "days": [0, 1, 2, ...],
    "daily_biogas_m3": [0.08, 0.45, 1.1, ...],
    "cumulative_biogas_m3": [0.08, 0.53, 1.63, ...]
  }
}
```

---

## Llenados

### Listar Llenados

**GET** `/api/dashboard/fillings/`

Lista etapas de llenado (últimas 50).

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "results": [
    {
      "id": 5,
      "number": 5,
      "date": "2025-01-10",
      "people": "Juan Pérez, María García",
      "material_type": "bovino",
      "material_amount_kg": 50.0,
      "material_humidity_pct": 80.0,
      "added_water_m3": 0.5,
      "temperature_c": 32.0,
      "active": true,
      "created_at": "2025-01-10T08:00:00Z"
    }
  ],
  "count": 5
}
```

### Crear Llenado

**POST** `/api/dashboard/fillings/`

Crea una nueva etapa de llenado.

**Request Body:**
```json
{
  "material_type": "bovino",
  "material_amount_kg": 50.0,
  "material_humidity_pct": 80.0,
  "added_water_m3": 0.5,
  "temperature_c": 32.0,
  "people": "Juan Pérez"
}
```

**Response:** 201 Created
```json
{
  "id": 6,
  "detail": "Llenado registrado correctamente."
}
```

### Cerrar Llenado Actual

**POST** `/api/dashboard/fillings/close_current/`

Cierra la etapa activa.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "detail": "Etapa #5 cerrada.",
  "stage_id": 5
}
```

### Obtener Producción de Llenado

**GET** `/api/dashboard/fillings/{id}/production/`

Obtiene datos de producción de una etapa específica.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** Similar a `/production/current/`

---

## Reportes

### Listar Reportes

**GET** `/api/dashboard/reports/`

Lista todos los reportes generados.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
[
  {
    "id": 10,
    "created_at": "2025-01-15T10:30:00Z",
    "report_type": "normal",
    "stage": 5,
    "production_estimated": 12.5,
    "production_real": 11.8,
    "file_pdf": "/media/reports/pdf/reporte_10.pdf",
    "file_excel": "/media/reports/excel/reporte_10.xlsx",
    "file_csv": "/media/reports/csv/reporte_10.csv"
  }
]
```

### Crear Reporte

**POST** `/api/dashboard/reports/`

Genera un nuevo reporte.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "stage_id": 5,
  "report_type": "normal",
  "observations": "Producción dentro de parámetros normales",
  "inferences": "Se observa buena eficiencia de conversión"
}
```

**Response:** 201 Created
```json
{
  "id": 11,
  "stage_active": true,
  "pdf_url": "/api/dashboard/report/download/11/pdf/",
  "excel_url": "/api/dashboard/report/download/11/excel/",
  "csv_url": "/api/dashboard/report/download/11/csv/",
  "detail": "Reporte generado correctamente."
}
```

### Descargar Reporte

**GET** `/api/dashboard/reports/{id}/download/?filetype=pdf`

Descarga un archivo del reporte.

**Query Parameters:**
- `filetype`: `pdf`, `excel`, o `csv`
- `inline`: `1` o `true` para visualizar en navegador

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** Archivo solicitado

---

## Dispositivos IoT

### Listar Tipos de Dispositivos

**GET** `/api/dashboard/device-types/`

Lista tipos de dispositivos disponibles.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
[
  {
    "id": 1,
    "name": "Sensor de Presión BMP180",
    "category": "SENSOR",
    "description": "Sensor barométrico de alta precisión",
    "manufacturer": "Bosch",
    "model_number": "BMP180",
    "specs": {
      "range": "300-1100 hPa",
      "accuracy": "±0.12 hPa"
    },
    "mqtt_topic_pattern": "sensors/{device_id}/pressure",
    "instances_count": 3
  }
]
```

### Registrar Dispositivo

**POST** `/api/dashboard/devices/register/`

Registra un nuevo sensor o actuador.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "device_type_id": 1,
  "device_id": "SENSOR_PRES_001",
  "name": "Sensor de Presión - Entrada",
  "location": "Tubería de entrada del biodigestor",
  "mqtt_topic": "sensors/pres001/data",
  "measurement_type_ids": [1, 2],
  "config": {
    "sampling_rate": 60,
    "units": "hPa"
  },
  "notes": "Instalado el 2025-01-15"
}
```

**Response:** 201 Created
```json
{
  "id": 5,
  "device_id": "SENSOR_PRES_001",
  "message": "Dispositivo registrado exitosamente",
  "device": {
    "id": 5,
    "device_type": 1,
    "device_type_name": "Sensor de Presión BMP180",
    "device_category": "SENSOR",
    "device_id": "SENSOR_PRES_001",
    "name": "Sensor de Presión - Entrada",
    "location": "Tubería de entrada del biodigestor",
    "status": "ACTIVE",
    "mqtt_topic": "sensors/pres001/data",
    "is_online": false,
    "needs_calibration": false
  }
}
```

### Listar Dispositivos Registrados

**GET** `/api/dashboard/devices/`

Lista todos los dispositivos registrados.

**Query Parameters:**
- `status`: `ACTIVE`, `INACTIVE`, `MAINTENANCE`, `ERROR`
- `category`: `SENSOR`, `ACTUATOR`
- `online`: `1` o `true` para solo en línea

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
[
  {
    "id": 5,
    "device_type": 1,
    "device_type_name": "Sensor de Presión BMP180",
    "device_category": "SENSOR",
    "device_id": "SENSOR_PRES_001",
    "name": "Sensor de Presión - Entrada",
    "location": "Tubería de entrada del biodigestor",
    "status": "ACTIVE",
    "measurement_types": [1, 2],
    "mqtt_topic": "sensors/pres001/data",
    "is_online": true,
    "needs_calibration": false,
    "last_seen": "2025-01-15T12:45:00Z",
    "registered_at": "2025-01-15T08:00:00Z"
  }
]
```

### Verificar Estado de Dispositivo

**GET** `/api/dashboard/devices/{id}/status_check/`

Verifica el estado actual de un dispositivo.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "device_id": "SENSOR_PRES_001",
  "name": "Sensor de Presión - Entrada",
  "status": "ACTIVE",
  "is_online": true,
  "last_seen": "2025-01-15T12:45:00Z",
  "needs_calibration": false,
  "last_calibration": "2025-01-01T00:00:00Z",
  "last_reading": {
    "id": 1234,
    "value": 1013.25,
    "measurement_type": 1,
    "measurement_name": "Presión Atmosférica",
    "measurement_unit": "hPa",
    "timestamp": "2025-01-15T12:45:00Z"
  },
  "readings_count_24h": 1440
}
```

### Calibrar Dispositivo

**POST** `/api/dashboard/devices/{id}/calibrate/`

Registra una calibración.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "frequency_days": 30,
  "notes": "Calibrado con patrón certificado"
}
```

**Response:** 200 OK
```json
{
  "message": "Calibración registrada",
  "last_calibration": "2025-01-15T13:00:00Z",
  "calibration_frequency_days": 30
}
```

### Estadísticas de Dispositivos

**GET** `/api/dashboard/devices/statistics/`

Obtiene estadísticas generales de dispositivos.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "total_devices": 15,
  "active_devices": 12,
  "inactive_devices": 2,
  "maintenance_devices": 1,
  "error_devices": 0,
  "sensors_count": 10,
  "actuators_count": 5,
  "online_devices": 14,
  "needs_calibration_count": 2,
  "readings_today": 20160,
  "actions_today": 45
}
```

---

## Alertas

### Listar Alertas

**GET** `/api/dashboard/alerts/`

Lista alertas del sistema.

**Query Parameters:**
- `resolved`: `true` para incluir resueltas
- `level`: `INFO`, `WARN`, `CRIT`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
[
  {
    "id": 25,
    "level": "WARN",
    "message": "Presión fuera de rango",
    "details": {
      "presion": 1020.5,
      "device_id": "SENSOR_PRES_001"
    },
    "created_at": "2025-01-15T12:00:00Z",
    "resolved": false
  }
]
```

### Resolver Alerta

**POST** `/api/dashboard/alerts/{id}/resolve/`

Marca una alerta como resuelta.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response:** 200 OK
```json
{
  "detail": "Alerta resuelta"
}
```

---

## WebSockets

### Conexión WebSocket para Sensores

**WS** `/ws/sensors/`

Recibe datos de sensores en tiempo real.

**Mensaje de ejemplo:**
```json
{
  "type": "sensor_reading",
  "reading_id": 1234,
  "stage_id": 5,
  "timestamp": "2025-01-15T12:45:00Z",
  "pressure_hpa": 1013.25,
  "gas_flow": 0.5,
  "raw_payload": {
    "device_id": "SENSOR_PRES_001",
    "presion": 1013.25,
    "temperatura": 32.5
  }
}
```

### Conexión WebSocket para Alertas

**WS** `/ws/alerts/`

Recibe alertas en tiempo real.

**Mensaje de ejemplo:**
```json
{
  "type": "alert_notification",
  "alert_id": 25,
  "level": "WARN",
  "message": "Presión fuera de rango",
  "details": {
    "presion": 1020.5
  },
  "created_at": "2025-01-15T12:00:00Z",
  "is_critical": false
}
```

---

## Códigos de Estado HTTP

- **200 OK**: Solicitud exitosa
- **201 Created**: Recurso creado exitosamente
- **400 Bad Request**: Datos inválidos
- **401 Unauthorized**: No autenticado
- **403 Forbidden**: Sin permisos
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error del servidor

---

## Notas de Implementación

### Paginación

Endpoints que retornan listas soportan paginación:
- `page`: Número de página (default: 1)
- `page_size`: Elementos por página (default: 20, max: 100)

### Caché

Algunos endpoints utilizan caché Redis para mejorar rendimiento:
- Estadísticas de dashboard: 5 minutos
- Lista de tipos de dispositivos: 1 hora
- Lista de tipos de mediciones: 1 hora

### Rate Limiting

- Usuarios autenticados: 100 requests/minuto
- Usuarios no autenticados: 20 requests/minuto

---

**Última actualización:** 2025-01-15  
**Versión de API:** 2.0  
**Contacto:** equipo@biogestor.com
