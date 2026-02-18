<p align="center">
  <img src="https://raw.githubusercontent.com/CharFranR/Python/refs/heads/main/Logo%20BioGestor.png" alt="Biogestor Logo"/>
</p>

<h1 align="center">🌿 Sistema Biogestor</h1>

<p align="center">
  <strong>Plataforma integral para monitoreo y gestión de biodigestores</strong>
</p>

<p align="center">
  <a href="#características">Características</a> •
  <a href="#tecnologías">Tecnologías</a> •
  <a href="#inicio-rápido">Inicio Rápido</a> •
  <a href="#documentación">Documentación</a> •
  <a href="#contribuir">Contribuir</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-4.2+-green?style=for-the-badge&logo=django" alt="Django"/>
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue?style=for-the-badge&logo=postgresql" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/Redis-7-red?style=for-the-badge&logo=redis" alt="Redis"/>
  <img src="https://img.shields.io/badge/MQTT-Mosquitto-purple?style=for-the-badge" alt="MQTT"/>
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js" alt="Next.js"/>
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue?style=for-the-badge&logo=typescript" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/TailwindCSS-3.4-skyblue?style=for-the-badge&logo=tailwindcss" alt="TailwindCSS"/>
  <img src="https://img.shields.io/badge/Docker-Ready-blue?style=for-the-badge&logo=docker" alt="Docker"/>
</p>

---

## 🎯 ¿Qué es Sistema Biogestor?

**Sistema Biogestor** es una solución tecnológica desarrollada para el **CIDTEA** que permite monitorear, controlar y optimizar el funcionamiento de biodigestores de manera eficiente y en tiempo real.

El sistema integra **sensores IoT**, **modelos matemáticos de predicción** y una **interfaz web intuitiva** para facilitar la gestión completa del proceso de producción de biogás.

---

## ✨ Características

### 📡 Monitoreo en Tiempo Real
- Recepción de datos de sensores vía **MQTT**
- Visualización instantánea mediante **WebSockets**
- Historial completo de mediciones

### 📊 Predicción Inteligente
- Modelo matemático de **Gompertz** para estimar producción
- Comparación de producción real vs esperada
- Alertas y notificaciones predictivas

### 🔧 Gestión Completa
- **Llenados**: Registro y seguimiento de cada ciclo
- **Sensores**: Configuración y calibración
- **Inventario**: Control de materiales y equipos
- **Reportes**: Generación automática de PDFs

### 🔒 Seguridad
- Autenticación JWT
- Control de acceso basado en roles
- API REST segura

---

## 🛠️ Tecnologías

<table>
  <tr>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/django/django-plain.svg" width="48" height="48" alt="Django" />
      <br>Django
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg" width="48" height="48" alt="PostgreSQL" />
      <br>PostgreSQL
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg" width="48" height="48" alt="Redis" />
      <br>Redis
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg" width="48" height="48" alt="Docker" />
      <br>Docker
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nginx/nginx-original.svg" width="48" height="48" alt="Nginx" />
      <br>Nginx
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg" width="48" height="48" alt="Next.js" />
      <br>Next.js
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-plain.svg" width="48" height="48" alt="TypeScript" />
      <br>TypeScript
    </td>
    <td align="center" width="96">
      <img src="https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-plain.svg" width="48" height="48" alt="Tailwind CSS" />
      <br>Tailwind CSS
    </td>
  </tr>
</table>

| Componente | Tecnología | Descripción |
|------------|------------|-------------|
| **Backend** | Django + DRF | API REST robusta y escalable |
| **Tiempo Real** | Channels + Redis | WebSockets para datos en vivo |
| **IoT** | MQTT + Mosquitto | Comunicación con sensores |
| **Frontend** | Next.js + React | Interfaz de usuario moderna y dinámica |
| **Estilos** | Tailwind CSS | Framework CSS utilitario para diseño |
| **Base de Datos** | PostgreSQL | Almacenamiento persistente |
| **Contenedores** | Docker Compose | Despliegue simplificado |

---

## 🚀 Inicio Rápido

### Requisitos previos
- Docker y Docker Compose
- Git

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/biogestor.git
cd biogestor

# Levantar todos los servicios
docker-compose up -d

# ¡Listo! Accede a:
# - API: http://localhost:8000
# - Frontend (servido por Nginx): http://localhost:8080
```

### Servicios disponibles

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| Backend API | 8000 | Django REST Framework |
| Frontend (Next.js) | 8080 | Interfaz web de usuario |
| PostgreSQL | 5432 | Base de datos |
| Redis | 6379 | Cache y mensajería |
| MQTT Broker | 1883 | Comunicación IoT |

---

## 📚 Documentación

| Recurso | Descripción |
|---------|-------------|
| 📖 [Documentación Técnica](Docs/index.html) | API, modelos y arquitectura detallada |
| 🤖 [Guía para Agentes IA](AGENTS.md) | Contexto para asistentes de código |
| 📋 [Backend README](backend/README.md) | Documentación específica del backend |
| 📄 [Frontend (Next.js) README](frontend/nextjs-app/README.md) | Documentación específica del frontend |

---

## 📁 Estructura del Proyecto

```
biogestor/
├── 📂 backend/           # API Django REST
│   ├── BatchModel/       # Modelo matemático Gompertz
│   ├── dataSensor/       # Gestión de sensores
│   ├── Fill/             # Ciclos de llenado
│   ├── calibrations/     # Calibraciones
│   └── inventario/       # Control de inventario
├── 📂 frontend/
│   └── nextjs-app/       # Aplicación frontend Next.js
├── 📂 Docs/              # Documentación (HTML, Markdown)
├── 📂 scripts/           # Utilidades (simulador MQTT)
├── 📂 mosquitto/         # Config broker MQTT
├── 🐳 docker-compose.yml # Orquestación de servicios
└── 📄 AGENTS.md          # Guía para IA
```

---

## 🧮 Modelo Matemático

El sistema utiliza el **modelo de Gompertz modificado** para predecir la producción de biogás:

$$Y(t) = P \times e^{-b \times e^{-c \times t}}$$

Donde:
- **Y(t)** = Producción acumulada de biogás
- **P** = Producción potencial máxima
- **b, c** = Parámetros de forma y crecimiento

Este modelo permite estimar con precisión la curva de producción basándose en:
- Tipo de material orgánico
- Masa y humedad del sustrato
- Temperatura del proceso
- Tiempo de retención

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. Fork el repositorio
2. Crea una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto fue desarrollado para el **CIDTEA** (Centro de Investigación y Desarrollo de Tecnologías de Energías Alternativas).

---

## 📞 Contacto

**CIDTEA** - Centro de Investigación y Desarrollo de Tecnologías de Energías Alternativas

---

<p align="center">
  Hecho con 💚 para un futuro sustentable
</p>

*Última actualización: 30 de enero de 2026*

