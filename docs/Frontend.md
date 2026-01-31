# Frontend Next.js - Sistema Biogestor

Documentación técnica del frontend del Sistema Biogestor desarrollado con Next.js 14+.

## 📋 Índice

- [Tecnologías](#tecnologías)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Arquitectura](#arquitectura)
- [Componentes](#componentes)
- [Servicios API](#servicios-api)
- [Autenticación](#autenticación)
- [WebSocket](#websocket)
- [Páginas](#páginas)
- [Estilos](#estilos)
- [Despliegue](#despliegue)

---

## Tecnologías

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Next.js | 14+ | Framework React con App Router |
| TypeScript | 5.x | Tipado estático |
| Tailwind CSS | 3.4 | Sistema de estilos utilitario |
| React Query | 5.60 | Cache y estado del servidor |
| Axios | 1.7 | Cliente HTTP |
| Chart.js | 4.5 | Visualización de gráficas |
| react-hook-form | 7.53 | Manejo de formularios |
| react-hot-toast | 2.5 | Notificaciones |
| js-cookie | 3.x | Manejo de cookies |
| react-icons | 5.x | Iconografía |

---

## Estructura del Proyecto

```
frontend/nextjs-app/
├── public/                    # Archivos estáticos
├── src/
│   ├── app/                   # App Router (páginas)
│   │   ├── globals.css        # Estilos globales
│   │   ├── layout.tsx         # Layout raíz
│   │   ├── page.tsx           # Página de inicio (redirección)
│   │   ├── (auth)/            # Grupo de rutas de autenticación
│   │   │   ├── layout.tsx     # Layout para auth (sin sidebar)
│   │   │   ├── login/         # /login
│   │   │   └── registro/      # /registro
│   │   └── (protected)/       # Grupo de rutas protegidas
│   │       ├── layout.tsx     # Layout con sidebar y header
│   │       ├── sensores/      # /sensores - Dashboard tiempo real
│   │       ├── perfil/        # /perfil - Perfil de usuario
│   │       ├── permisos/      # /permisos - Gestión de usuarios
│   │       ├── llenados/      # /llenados - Gestión de llenados
│   │       ├── calibraciones/ # /calibraciones - Calibraciones
│   │       ├── inventario/    # /inventario - Inventario
│   │       └── calculadora/   # /calculadora - Simulador Gompertz
│   │
│   ├── components/            # Componentes React
│   │   ├── ui/                # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Tabs.tsx
│   │   │   └── index.ts
│   │   ├── Header.tsx         # Barra superior
│   │   ├── Sidebar.tsx        # Navegación lateral
│   │   └── SensorChart.tsx    # Gráfica de sensores
│   │
│   ├── hooks/                 # Custom hooks
│   │   ├── useWebSocket.ts    # WebSocket con reconexión
│   │   └── useSensorData.ts   # Datos de sensores
│   │
│   ├── lib/                   # Utilidades y servicios
│   │   ├── apiClient.ts       # Axios con interceptores JWT
│   │   ├── auth.ts            # Servicio de autenticación
│   │   ├── utils.ts           # Funciones utilitarias
│   │   └── services/          # Servicios API
│   │       ├── userService.ts
│   │       ├── sensorService.ts
│   │       ├── fillService.ts
│   │       ├── calibrationService.ts
│   │       ├── inventoryService.ts
│   │       └── calculatorService.ts
│   │
│   ├── providers/             # Context providers
│   │   └── Providers.tsx      # QueryClient provider
│   │
│   ├── types/                 # TypeScript definitions
│   │   └── index.ts           # Todas las interfaces
│   │
│   └── middleware.ts          # Protección de rutas
│
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.ts
└── postcss.config.js
```

---

## Instalación

```bash
# Navegar al directorio del frontend
cd frontend/nextjs-app

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar build de producción
npm start
```

---

## Configuración

### Variables de Entorno

Crear archivo `.env.local` en `frontend/nextjs-app/`:

```env
# URL del backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# URL del WebSocket
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Next.js Config (next.config.ts)

El archivo incluye rewrites para proxy de la API:

```typescript
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "http://localhost:8000/api/:path*",
    },
    {
      source: "/ws/:path*",
      destination: "ws://localhost:8000/ws/:path*",
    },
  ];
}
```

---

## Arquitectura

### Flujo de Datos

```
Usuario interactúa con la UI
         ↓
Componente React
         ↓
React Query Hook (useXXX)
         ↓
Servicio API (xxxService.ts)
         ↓
Axios Client (apiClient.ts)
         ↓
Backend Django REST API
         ↓
Respuesta con datos
         ↓
React Query (cache automático)
         ↓
Re-render componente
```

### React Query

Configuración de cache:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,      // 5 minutos para datos estáticos
      refetchOnWindowFocus: false,
    },
  },
});
```

Tiempos de cache específicos:
- **Datos estáticos** (materiales, variables): `staleTime: 5min`
- **Datos dinámicos** (sensores): `staleTime: 30sec`
- **WebSocket**: Datos en tiempo real sin cache

---

## Componentes

### Componentes UI Base (`src/components/ui/`)

| Componente | Props Principales | Uso |
|------------|-------------------|-----|
| `Button` | `variant`, `size`, `isLoading`, `leftIcon` | Botones de acción |
| `Card` | `title`, `icon`, `actions` | Contenedores de contenido |
| `StatCard` | `title`, `value`, `icon`, `trend` | Tarjetas de estadísticas |
| `Input` | `label`, `error`, `type` | Campos de texto |
| `Select` | `label`, `options`, `error` | Selectores |
| `Textarea` | `label`, `error`, `rows` | Áreas de texto |
| `Modal` | `isOpen`, `onClose`, `title`, `footer` | Diálogos modales |
| `ConfirmModal` | `onConfirm`, `variant`, `message` | Confirmaciones |
| `Table` | `columns`, `data`, `isLoading` | Tablas de datos |
| `Badge` | `variant`, `children` | Etiquetas de estado |
| `Tabs` | `tabs`, `defaultTab` | Pestañas de navegación |

### Ejemplo de uso:

```tsx
import { Button, Card, Table } from "@/components/ui";

function MyComponent() {
  return (
    <Card title="Mi Título" icon={<FiList />}>
      <Table
        columns={[
          { key: "name", header: "Nombre" },
          { key: "value", header: "Valor" }
        ]}
        data={myData}
        keyExtractor={(item) => item.id}
      />
      <Button variant="primary" onClick={handleClick}>
        Acción
      </Button>
    </Card>
  );
}
```

---

## Servicios API

### Estructura de Servicios

Cada servicio en `src/lib/services/` exporta:
- **Queries**: Hooks `useXXX` para obtener datos
- **Mutations**: Hooks `useCreateXXX`, `useUpdateXXX`, `useDeleteXXX`

### userService.ts

```typescript
// Queries
useCurrentUser()           // Usuario actual
useApprovedUsers()         // Usuarios aprobados
usePendingUsers()          // Usuarios pendientes

// Mutations
useApproveUser()           // Aprobar usuario
useUpdateUserPermissions() // Actualizar permisos
useUpdateUserRole()        // Cambiar rol
```

### sensorService.ts

```typescript
// Queries
useSensors()               // Lista de sensores
useMeasuredVariables()     // Variables medidas
useSensorData(sensorId)    // Datos históricos

// Mutations
useCreateSensor()
useUpdateSensor()
useDeleteSensor()
```

### fillService.ts

```typescript
// Queries
useFills()                 // Todos los llenados
useActiveFill()            // Llenado activo

// Mutations
useCreateFill()
useUpdateFill()
useDeleteFill()
useEndFill()               // Finalizar llenado
```

### calibrationService.ts

```typescript
// Queries
useCalibrations()          // Todas las calibraciones

// Mutations
useCreateCalibration()
useUpdateCalibration()
useDeleteCalibration()
```

### inventoryService.ts

```typescript
// Queries
useItems()                 // Items del inventario
usePlaces()                // Ubicaciones

// Mutations
useCreateItem(), useUpdateItem(), useDeleteItem()
useCreatePlace(), useUpdatePlace(), useDeletePlace()
useGeneratePlaceReport()   // Generar PDF
```

### calculatorService.ts

```typescript
// Queries
useBasicParams()           // Materiales base

// Mutations
useRunCalculation()        // Ejecutar simulación
```

---

## Autenticación

### Flujo de Autenticación

```
1. Usuario ingresa credenciales
         ↓
2. POST /api/auth/login/
         ↓
3. Backend retorna { access, refresh, user }
         ↓
4. Tokens guardados en cookies (HttpOnly opcional)
         ↓
5. Middleware verifica token en rutas protegidas
         ↓
6. Axios interceptor añade Authorization header
         ↓
7. En 401, intenta refresh automático
         ↓
8. Si refresh falla, redirige a /login
```

### Uso del Servicio de Auth

```typescript
import { authService } from "@/lib/auth";

// Login
const response = await authService.login({ username, password });

// Logout
authService.logout();

// Verificar autenticación
const isAuth = authService.isAuthenticated();

// Obtener usuario actual
const user = authService.getCurrentUser();
```

### Middleware de Protección

El archivo `src/middleware.ts` protege rutas:
- `/sensores`, `/perfil`, `/permisos`, etc. requieren autenticación
- Redirige a `/login` si no hay token válido

---

## WebSocket

### Hook useWebSocket

```typescript
const {
  isConnected,    // Estado de conexión
  data,           // Datos de sensores { [mqtt_code]: values[] }
  error,          // Error de conexión
  reconnect,      // Función para reconectar manualmente
} = useWebSocket();
```

### Características

- **Reconexión automática**: Exponential backoff (1s → 30s max)
- **Máximo reintentos**: 10 intentos antes de desistir
- **Heartbeat**: Mantiene conexión activa
- **Parsing automático**: Convierte mensajes JSON

### Formato de Datos

```typescript
// Mensaje del WebSocket
{
  type: "sensor_data",
  data: {
    "TEMP01": ["25.3", "25.4", "25.5"],
    "PH01": ["7.2", "7.1", "7.2"],
    "PRES01": ["1.01", "1.02", "1.01"]
  }
}
```

---

## Páginas

### /login
- Formulario de inicio de sesión
- Validación con react-hook-form
- Redirección a /sensores tras login exitoso

### /registro
- Formulario de registro de usuario
- Validación de contraseña y email
- Mensaje de "pendiente de aprobación"

### /sensores (Dashboard)
- Conexión WebSocket en tiempo real
- Gráficas de sensores con Chart.js
- Selector de rango de tiempo (5min, 15min, 1hr)
- Modal de gráfica a pantalla completa
- Indicador de estado del llenado activo

### /perfil
- Información del usuario actual
- Estadísticas de uso
- Lista de permisos asignados

### /permisos (Admin)
- Tabs: Usuarios aprobados / Pendientes
- Aprobar usuarios pendientes
- Editar permisos por usuario
- Cambiar roles (ADMIN/COLAB/VISIT)

### /llenados
- Lista de llenados con predicciones
- Crear nuevo llenado
- Finalizar llenado activo
- Ver predicción de producción

### /calibraciones
- CRUD de calibraciones
- Cálculo automático de error
- Selector de sensor
- Historial de calibraciones

### /inventario
- Tabs: Items / Ubicaciones
- CRUD de items y ubicaciones
- Exportar reporte PDF por ubicación

### /calculadora
- Formulario de parámetros de simulación
- Selector de material base
- Gráfica de producción acumulada
- Gráfica de producción diaria
- Información del modelo de Gompertz

---

## Estilos

### Tailwind CSS

Configuración de colores personalizados (`tailwind.config.ts`):

```typescript
colors: {
  primary: "#26a69a",      // Verde teal
  secondary: "#42a5f5",    // Azul
  accent: "#7e57c2",       // Púrpura
  success: "#66bb6a",      // Verde
  warning: "#ffa726",      // Naranja
  danger: "#ef5350",       // Rojo
  sidebar: "#1e293b",      // Gris oscuro
}
```

### Convenciones

- **No usar estilos inline**: Solo clases de Tailwind
- **Responsive**: Mobile-first (`sm:`, `md:`, `lg:`, `xl:`)
- **Dark mode**: Preparado con `dark:` (no implementado aún)

### Ejemplo de clases comunes:

```tsx
// Botón primario
<button className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">

// Card
<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">

// Input
<input className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent">
```

---

## Despliegue

### Docker

El proyecto incluye Dockerfile para producción:

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

### Variables de Producción

```env
NEXT_PUBLIC_API_URL=https://api.tudominio.com
NEXT_PUBLIC_WS_URL=wss://api.tudominio.com
```

### Nginx (recomendado)

```nginx
location / {
    proxy_pass http://frontend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
}
```

---

## Troubleshooting

### Problemas comunes

1. **WebSocket no conecta**
   - Verificar que el backend esté corriendo con Daphne
   - Revisar configuración de CORS/WebSocket en backend
   - Comprobar URL del WebSocket en variables de entorno

2. **401 en todas las peticiones**
   - Verificar que las cookies de tokens existan
   - Revisar que el interceptor de Axios esté funcionando
   - Comprobar que el token no haya expirado

3. **Gráficas no se renderizan**
   - Verificar que Chart.js esté registrado en el componente
   - Comprobar que los datos tengan el formato correcto

4. **Build falla**
   - Ejecutar `npm run lint` para ver errores de TypeScript
   - Verificar que todas las dependencias estén instaladas

---

*Documentación actualizada: Enero 2026*
