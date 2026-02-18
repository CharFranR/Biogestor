# Documentación de Endpoints del Backend (Sistema Biogestor)

Documentación verificada contra `urls.py`, `views.py` y `serializers.py` del backend actual.

- Base URL (desarrollo): `http://localhost:8000`
- Prefijo API: `/api/`
- Formato: `application/json`
- Rutas con barra final `/` (DRF)
- Endpoints protegidos: `Authorization: Bearer {token}`

---

## 1) Autenticación (`authentication`)

### `POST /api/auth/register/`
Crea usuario (pendiente de aprobación).

Body:
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

### `POST /api/auth/login/`
Login con JWT (solo usuario aprobado).

Body:
```json
{
  "username": "usuario",
  "password": "Password123!"
}
```

Respuesta incluye:
- `access`
- `refresh`
- `user` (con `is_superuser`, `profile`, `permissions`)

### `POST /api/auth/refresh/`
Refresca token.

Body:
```json
{
  "refresh": "<refresh_token>"
}
```

### `POST /api/auth/logout/`
Logout (blacklist refresh token).

Body requerido:
```json
{
  "refresh_token": "<refresh_token>"
}
```

---

## 2) Usuarios (`authentication`)

### `GET /api/users/`
Lista usuarios aprobados.

### `GET /api/users/{id}/`
Detalle de usuario.

### `GET /api/users/pending/`
Lista usuarios pendientes.

### `GET /api/users/me/`
Usuario autenticado actual.

### `POST /api/users/{id}/approve/`
Aprueba usuario.

### `GET /api/users/{id}/permissions/`
Obtiene permisos del usuario.

### `POST /api/users/{id}/permissions/`
Actualiza permisos (solo superusuario).

Body parcial ejemplo:
```json
{
  "ViewReports": true,
  "ViewDashboard": true
}
```

### `POST /api/users/{id}/role/`
Cambia rol y aplica plantilla de permisos (`ADMIN`, `COLAB`, `VISIT`).

Body:
```json
{
  "role": "COLAB"
}
```

---

## 3) BatchModel (`BatchModel`)

### BasicParams
- `GET /api/BasicParams/`
- `POST /api/BasicParams/`
- `GET /api/BasicParams/{id}/`
- `PUT /api/BasicParams/{id}/`
- `PATCH /api/BasicParams/{id}/`
- `DELETE /api/BasicParams/{id}/`

Body ejemplo:
```json
{
  "supplyName": "Estiercol bovino",
  "TS": 0.15,
  "VSTS": 0.8,
  "potencial_production": 0.3
}
```

### Cálculo Gompertz
### `POST /api/calculation/`

Body:
```json
{
  "filling_mass": 100,
  "approx_density": 1.05,
  "added_watter": 50,
  "type_material": 1,
  "filling_moisture": 80,
  "delay_time": 5,
  "temperature": 35
}
```

Nota importante:
- `type_material` acepta **ID numérico** o `supplyName`.

---

## 4) Variables y Sensores (`dataSensor`)

### MeasuredVariables
- `GET /api/measuredVariables/`
- `POST /api/measuredVariables/`
- `GET /api/measuredVariables/{id}/`
- `PUT /api/measuredVariables/{id}/`
- `PATCH /api/measuredVariables/{id}/`
- `DELETE /api/measuredVariables/{id}/`

Body ejemplo:
```json
{
  "name": "Temperatura"
}
```

### Sensors
- `GET /api/sensors/`
- `POST /api/sensors/`
- `GET /api/sensors/{id}/`
- `PUT /api/sensors/{id}/`
- `PATCH /api/sensors/{id}/`
- `DELETE /api/sensors/{id}/`

Body de creación/actualización:
```json
{
  "name": "Sensor Temperatura 1",
  "mqtt_code": "temp01",
  "measured_variable_id": 1,
  "min_range": 0,
  "max_range": 100,
  "hysteresis": 0.5,
  "accuracy": 0.1,
  "precision": 0.05
}
```

Nota importante:
- El backend espera `measured_variable_id` (no `measured_variable`) para escritura.

### Sensor Data
- `GET /api/sensor-data/`
- `GET /api/sensor-data/?sensor={sensorId}`
- `GET /api/sensor-data/?fill={fillId}`
- `GET /api/sensor-data/{id}/`
- `PUT /api/sensor-data/{id}/`
- `PATCH /api/sensor-data/{id}/`
- `DELETE /api/sensor-data/{id}/`

Estado actual de `POST /api/sensor-data/`:
- La validación del serializer permite `value`, pero `sensor` está en modo read-only.
- En el estado actual, hacer `POST` produce error de integridad (`sensor_id` nulo).

---

## 5) Llenados (`Fill`)

### Fill
- `GET /api/Fill/`
- `POST /api/Fill/`
- `GET /api/Fill/{id}/`
- `PUT /api/Fill/{id}/`
- `PATCH /api/Fill/{id}/`
- `DELETE /api/Fill/{id}/`

Body ejemplo:
```json
{
  "filling_mass": 150,
  "approx_density": 1.02,
  "added_watter": 75,
  "type_material": 1,
  "filling_moisture": 75,
  "delay_time": 3,
  "people_involved": "Juan Perez, Maria Garcia"
}
```

Notas importantes:
- `type_material` en `Fill` es numérico (ID de material).
- Al crear llenado se genera automáticamente `prediction`.

### Acción custom
### `POST /api/Fill/{id}/end_fill/`
Finaliza el llenado activo (`last_day = fecha actual`).

---

## 6) Calibraciones (`calibrations`)

### Calibration
- `GET /api/calibration/`
- `POST /api/calibration/`
- `GET /api/calibration/{id}/`
- `PUT /api/calibration/{id}/`
- `PATCH /api/calibration/{id}/`
- `DELETE /api/calibration/{id}/`

Body de creación (actual):
```json
{
  "userId": 1,
  "sensorId": 1,
  "date": "2026-02-17",
  "params": "offset: 0.5, gain: 1.02",
  "note": "Calibración de rutina mensual",
  "result": "OK"
}
```

Nota importante:
- En el serializer actual, `date` es requerido al crear.
- `previous_calibration` se calcula automáticamente.

---

## 7) Inventario (`inventario`)

### Items
- `GET /api/items/`
- `POST /api/items/`
- `GET /api/items/{id}/`
- `PUT /api/items/{id}/`
- `PATCH /api/items/{id}/`
- `DELETE /api/items/{id}/`

Body ejemplo:
```json
{
  "name": "Sensor DS18B20",
  "measurement": "unidad",
  "quantity": 5,
  "place": 1,
  "description": "Sensor de repuesto"
}
```

Campos serializados actualmente:
- `id`
- `name`
- `measurement`
- `quantity`
- `place`
- `description`

### Place
- `GET /api/place/`
- `POST /api/place/`
- `GET /api/place/{id}/`
- `PUT /api/place/{id}/`
- `PATCH /api/place/{id}/`
- `DELETE /api/place/{id}/`

Body ejemplo:
```json
{
  "name": "Almacén de sensores"
}
```

### Acción custom
### `POST /api/place/{id}/generate_report/`
Retorna PDF con inventario del lugar.

Response:
- `Content-Type: application/pdf`

---

## 8) Tiempo real

### WebSocket
- URL: `ws://localhost:8000/ws/dataSensor/`
- Emite datos en tiempo real desde Redis por topics MQTT.

### MQTT
- Topic: `Biogestor/{mqtt_code}`
- Payload: valor numérico como string (ejemplo `35.5`).

---

## 9) Endpoints no implementados actualmente

No existen en backend actual:
- `GET /api/production/by-fill/{fillId}/`
- `GET /api/production/summary/{fillId}/`

El frontend fue ajustado para usar:
- `GET /api/sensor-data/?fill={fillId}`
como fuente de producción real.
