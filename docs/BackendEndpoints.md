# Documentacion de Endpoints del Backend (Sistema Biogestor)

Esta guia documenta los endpoints disponibles del backend de Biogestor con ejemplos de peticiones y respuestas JSON.

- Base URL (desarrollo): `http://localhost:8000`
- Formato: `application/json`
- Las rutas usan barra final `/` (Django REST Framework)
- Para endpoints protegidos: `Authorization: Bearer {token}`

---

## Autenticacion (JWT)

### 1) Registrar usuario

- Metodo y ruta: `POST /api/auth/register/`
- Descripcion: Crea un usuario y queda pendiente de aprobacion por admin.
- Body (JSON):

```json
{
  "username": "nuevo_usuario",
  "email": "nuevo@correo.com",
  "password": "Password123!",
  "password2": "Password123!",
  "first_name": "Juan",
  "last_name": "Perez"
}
```

- Respuesta 201 (JSON):

```json
{
  "message": "User registered successfully. Await admin approval.",
  "user": {
    "id": 12,
    "username": "nuevo_usuario",
    "email": "nuevo@correo.com",
    "first_name": "Juan",
    "last_name": "Perez",
    "profile": {
      "aprobado": false,
      "rol": "VISIT",
      "permissions": {
        "id": 1,
        "ApproveUsers": false,
        "ViewReports": false,
        "GenerateReports": false,
        "ViewDashboard": false,
        "ViewCalibrations": false,
        "ViewInventory": false,
        "ModifyInventory": false
      }
    }
  }
}
```

### 2) Login usuario

- Metodo y ruta: `POST /api/auth/login/`
- Descripcion: Autentica un usuario aprobado y devuelve JWT.
- Body (JSON):

```json
{
  "username": "usuario",
  "password": "Password123!"
}
```

- Respuesta 200 (JSON):

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 5,
    "username": "usuario",
    "email": "usuario@correo.com",
    "first_name": "Maria",
    "last_name": "Lopez",
    "profile": {
      "aprobado": true,
      "rol": "COLAB",
      "permissions": {
        "ApproveUsers": false,
        "ViewReports": true,
        "GenerateReports": false,
        "ViewDashboard": true,
        "ViewCalibrations": true,
        "ViewInventory": false,
        "ModifyInventory": false
      }
    }
  }
}
```

### 3) Refrescar token

- Metodo y ruta: `POST /api/auth/refresh/`
- Body (JSON):

```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

- Respuesta 200 (JSON):

```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### 4) Logout

- Metodo y ruta: `POST /api/auth/logout/`
- Requiere Authorization header.
- Body (JSON):

```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

- Respuesta 200 (JSON):

```json
{
  "message": "Logged out successfully."
}
```

---

## Usuarios

### 5) Listar usuarios aprobados

- Metodo y ruta: `GET /api/users/`
- Descripcion: Lista usuarios aprobados (requiere permiso ApproveUsers).
- Respuesta 200 (JSON):

```json
{
  "total": 3,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@correo.com",
      "first_name": "Admin",
      "last_name": "Principal",
      "profile": {
        "aprobado": true,
        "rol": "ADMIN",
        "permissions": {
          "ApproveUsers": true,
          "ViewReports": true,
          "GenerateReports": true,
          "ViewDashboard": true,
          "ViewCalibrations": true,
          "ViewInventory": true,
          "ModifyInventory": true
        }
      }
    }
  ]
}
```

### 6) Listar usuarios pendientes

- Metodo y ruta: `GET /api/users/pending/`
- Descripcion: Usuarios sin aprobar (requiere ApproveUsers).
- Respuesta 200 (JSON):

```json
{
  "total_pending": 2,
  "users": [
    {
      "id": 9,
      "username": "pendiente01",
      "email": "pendiente01@correo.com",
      "first_name": "",
      "last_name": "",
      "profile": {
        "aprobado": false,
        "rol": "VISIT",
        "permissions": {
          "ApproveUsers": false,
          "ViewReports": false,
          "GenerateReports": false,
          "ViewDashboard": false,
          "ViewCalibrations": false,
          "ViewInventory": false,
          "ModifyInventory": false
        }
      }
    }
  ]
}
```

### 7) Usuario actual

- Metodo y ruta: `GET /api/users/me/`
- Descripcion: Devuelve datos del usuario autenticado.

### 8) Aprobar usuario

- Metodo y ruta: `POST /api/users/{id}/approve/`
- Descripcion: Aprueba un usuario (requiere ApproveUsers).
- Respuesta 200 (JSON):

```json
{
  "message": "User pendiente01 approved.",
  "user": {
    "id": 9,
    "username": "pendiente01",
    "email": "pendiente01@correo.com",
    "profile": {
      "aprobado": true,
      "rol": "VISIT",
      "permissions": {
        "ApproveUsers": false,
        "ViewReports": false,
        "GenerateReports": false,
        "ViewDashboard": false,
        "ViewCalibrations": false,
        "ViewInventory": false,
        "ModifyInventory": false
      }
    }
  }
}
```

### 9) Ver permisos de usuario

- Metodo y ruta: `GET /api/users/{id}/permissions/`
- Respuesta 200 (JSON):

```json
{
  "user_id": 9,
  "username": "pendiente01",
  "permissions": {
    "ApproveUsers": false,
    "ViewReports": false,
    "GenerateReports": false,
    "ViewDashboard": false,
    "ViewCalibrations": false,
    "ViewInventory": false,
    "ModifyInventory": false
  }
}
```

### 10) Actualizar permisos de usuario

- Metodo y ruta: `POST /api/users/{id}/permissions/`
- Descripcion: Solo superusuario.
- Body (JSON):

```json
{
  "ViewReports": true,
  "ViewDashboard": true
}
```

### 11) Cambiar rol de usuario

- Metodo y ruta: `POST /api/users/{id}/role/`
- Descripcion: Solo superusuario. Roles validos: `ADMIN`, `COLAB`, `VISIT`.
- Body (JSON):

```json
{
  "role": "COLAB"
}
```

---

## BatchModel - BasicParams

### 12) Crear parametro de material

- Metodo y ruta: `POST /api/BasicParams/`
- Body (JSON):

```json
{
  "supplyName": "Estiercol bovino",
  "TS": 0.15,
  "VSTS": 0.8,
  "potencial_production": 0.3
}
```

### 13) Listar parametros

- Metodo y ruta: `GET /api/BasicParams/`

### 14) Obtener parametro

- Metodo y ruta: `GET /api/BasicParams/{id}/`

### 15) Actualizar parametro

- Metodo y ruta: `PUT /api/BasicParams/{id}/`

### 16) Eliminar parametro

- Metodo y ruta: `DELETE /api/BasicParams/{id}/`

---

## BatchModel - Calculo (Gompertz)

### 17) Ejecutar simulacion

- Metodo y ruta: `POST /api/calculation/`
- Body (JSON):

```json
{
  "filling_mass": 100,
  "approx_density": 1.05,
  "added_watter": 50,
  "type_material": "Estiercol bovino",
  "filling_moisture": 80,
  "delay_time": 5,
  "temperature": 35
}
```

- Respuesta 200 (JSON):

```json
{
  "total_solids": 20.0,
  "total_volatile_solids": 16.0,
  "potencial_production": 4.8,
  "max_mu": 0.334,
  "solvent_volume": 142.857,
  "initial_concentration": 0.112,
  "specific_mu": 0.167,
  "cumulative_production": [0.001, 0.003, 0.008],
  "derivative_production": [0.001, 0.002, 0.005]
}
```

> Nota: `type_material` debe coincidir con el `supplyName` de BasicParams.

---

## Variables Medidas (dataSensor)

### 18) Crear variable medida

- Metodo y ruta: `POST /api/measuredVariables/`
- Body (JSON):

```json
{
  "name": "Temperatura"
}
```

### 19) Listar variables

- Metodo y ruta: `GET /api/measuredVariables/`

### 20) Obtener variable

- Metodo y ruta: `GET /api/measuredVariables/{id}/`

### 21) Actualizar variable

- Metodo y ruta: `PUT /api/measuredVariables/{id}/`

### 22) Eliminar variable

- Metodo y ruta: `DELETE /api/measuredVariables/{id}/`

---

## Sensores (dataSensor)

### 23) Crear sensor

- Metodo y ruta: `POST /api/sensors/`
- Body (JSON):

```json
{
  "name": "Sensor Temperatura 1",
  "mqtt_code": "temp01",
  "measured_variable": 1,
  "min_range": 0,
  "max_range": 100,
  "hysteresis": 0.5,
  "accuracy": 0.1,
  "precision": 0.05
}
```

### 24) Listar sensores

- Metodo y ruta: `GET /api/sensors/`

### 25) Obtener sensor

- Metodo y ruta: `GET /api/sensors/{id}/`

### 26) Actualizar sensor

- Metodo y ruta: `PUT /api/sensors/{id}/`

### 27) Eliminar sensor

- Metodo y ruta: `DELETE /api/sensors/{id}/`

---

## Lecturas de Sensores (dataSensor)

### 28) Crear lectura manual

- Metodo y ruta: `POST /api/sensor-data/`
- Body (JSON):

```json
{
  "sensor": 1,
  "value": 36.2
}
```

### 29) Listar lecturas

- Metodo y ruta: `GET /api/sensor-data/`

### 30) Obtener lectura

- Metodo y ruta: `GET /api/sensor-data/{id}/`

### 31) Actualizar lectura

- Metodo y ruta: `PUT /api/sensor-data/{id}/`

### 32) Eliminar lectura

- Metodo y ruta: `DELETE /api/sensor-data/{id}/`

---

## Fill (Llenados)

### 33) Crear llenado

- Metodo y ruta: `POST /api/Fill/`
- Body (JSON):

```json
{
  "filling_mass": 150,
  "approx_density": 1.02,
  "added_watter": 75,
  "type_material": "Estiercol bovino",
  "filling_moisture": 75,
  "delay_time": 3,
  "people_involved": "Juan Perez, Maria Garcia"
}
```

### 34) Listar llenados

- Metodo y ruta: `GET /api/Fill/`

### 35) Obtener llenado

- Metodo y ruta: `GET /api/Fill/{id}/`

### 36) Actualizar llenado

- Metodo y ruta: `PUT /api/Fill/{id}/`

### 37) Eliminar llenado

- Metodo y ruta: `DELETE /api/Fill/{id}/`

### 38) Finalizar llenado activo

- Metodo y ruta: `POST /api/Fill/{id}/end_fill/`
- Descripcion: Marca el llenado activo como finalizado (last_day = fecha actual).

---

## Calibraciones

### 39) Crear calibracion

- Metodo y ruta: `POST /api/calibration/`
- Body (JSON):

```json
{
  "userId": 1,
  "sensorId": 1,
  "params": "offset: 0.5, gain: 1.02",
  "note": "Calibracion de rutina mensual",
  "result": "OK - Dentro de tolerancia"
}
```

### 40) Listar calibraciones

- Metodo y ruta: `GET /api/calibration/`

### 41) Obtener calibracion

- Metodo y ruta: `GET /api/calibration/{id}/`

### 42) Actualizar calibracion

- Metodo y ruta: `PUT /api/calibration/{id}/`

### 43) Eliminar calibracion

- Metodo y ruta: `DELETE /api/calibration/{id}/`

---

## Inventario - Items

### 44) Crear item

- Metodo y ruta: `POST /api/items/`
- Body (JSON):

```json
{
  "name": "Sensor de temperatura DS18B20",
  "quantity": 5,
  "place": 1
}
```

### 45) Listar items

- Metodo y ruta: `GET /api/items/`

### 46) Obtener item

- Metodo y ruta: `GET /api/items/{id}/`

### 47) Actualizar item

- Metodo y ruta: `PUT /api/items/{id}/`

### 48) Eliminar item

- Metodo y ruta: `DELETE /api/items/{id}/`

---

## Inventario - Lugares

### 49) Crear lugar

- Metodo y ruta: `POST /api/place/`
- Body (JSON):

```json
{
  "name": "Almacen de sensores"
}
```

### 50) Listar lugares

- Metodo y ruta: `GET /api/place/`

### 51) Obtener lugar

- Metodo y ruta: `GET /api/place/{id}/`

### 52) Actualizar lugar

- Metodo y ruta: `PUT /api/place/{id}/`

### 53) Eliminar lugar

- Metodo y ruta: `DELETE /api/place/{id}/`

### 54) Generar reporte PDF

- Metodo y ruta: `POST /api/place/{id}/generate_report/`
- Descripcion: Retorna un PDF con el inventario del lugar.
- Response: `Content-Type: application/pdf`

---

## Tiempo Real

### 55) WebSocket datos de sensores

- URL: `ws://localhost:8000/ws/dataSensor/`
- Descripcion: Envia las ultimas 30 lecturas por topic MQTT.

### 56) MQTT (publicacion de sensores)

- Topic: `Biogestor/{mqtt_code}`
- Payload: Valor numerico como string, ejemplo `35.5`.
