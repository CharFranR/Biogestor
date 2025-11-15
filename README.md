# Biogestor

<p align="center">
    <img src="https://github.com/CharFranR/Python/blob/main/Logo%20BioGestor.png?raw=true" alt="Logo" width="600"/>
</p>

![Estado](https://img.shields.io/badge/Estado-En_desarrollo-blue.svg)
![Licencia](https://img.shields.io/badge/Licencia-Todos_los_derechos_reservados-red.svg)

#### ¿Qué es?

Biogestor es una aplicación web de gestión de procesos y residuos orgánicos orientada a MIPYMEs del sector alimenticio.

#### Misión

Convertimos residuos orgánicos en soluciones útiles, brindando a las MIPYMEs herramientas digitales para estandarizar procesos, reducir desperdicios y fomentar la innovación sostenible.

#### Visión

Ser la plataforma líder que impulsa a las MIPYMEs hacia una producción eficiente, sostenible e innovadora en Nicaragua.

#### Funcionalidades

- **Dashboard en Tiempo Real**: Monitoreo de biodigestores con WebSockets
- **Gestión de Llenados**: Control de etapas de producción de biogás
- **Reportes Científicos**: Generación de reportes PDF/Excel con análisis técnico
- **Sistema IoT**: Registro y monitoreo de n sensores y actuadores
- **Calculadora Avanzada**: Modelo matemático validado científicamente
- **Gestión de Usuarios**: Sistema de permisos por roles
- **Alertas Automáticas**: Notificaciones en tiempo real de eventos críticos
- **Marketplace de Recursos**: Descarga de documentación y recursos
- **Asistente Virtual**: Chatbot integrado

#### Tecnologías Utilizadas

**Backend:**
- Django 4.2+ & Django REST Framework
- Python 3.13+
- PostgreSQL 15
- Redis 7 (caché y WebSockets)
- Channels (WebSockets)
- MQTT (IoT)

**Frontend:**
- React 18
- TypeScript
- Styled Components
- Chart.js
- Vite

**DevOps:**
- Docker & Docker Compose
- Nginx
- Daphne (ASGI server)

**IoT:**
- MQTT (Eclipse Mosquitto)
- Sensores y actuadores configurables

---


# Instalación

### Requisitos previos

- Tener activada la virtualización.
- Haber instalado e iniciado docker desktop.


#### Clonar el repositorio

```bash
git clone https://github.com/CharFranR/Biogestor.git
cd Biogestor
```

#### Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```bash
cp .env.example .env
# Editar .env con tus configuraciones
```

#### Iniciar con Docker (Recomendado)

```bash
# Construir e iniciar todos los servicios
docker-compose up --build

# Crear superusuario
docker-compose exec backend python manage.py createsuperuser
```

**Servicios disponibles:**
- Backend API: http://localhost:8000
- Frontend: http://localhost:8080
- Admin Django: http://localhost:8000/admin
- PostgreSQL: localhost:5432
- Redis: localhost:6379
- MQTT: localhost:1883

#### Desarrollo Local (Sin Docker)

Ver la [Guía de Desarrollo](Docs/DEVELOPER_GUIDE.md) para instrucciones detalladas de configuración local.

---

## 📚 Documentación

- **[Guía de Desarrollo](Docs/DEVELOPER_GUIDE.md)**: Setup completo y mejores prácticas
- **[Documentación de API](Docs/API_DOCUMENTATION.md)**: Todos los endpoints REST
- **[Modelo Matemático](backend/biocalculadora/README_MODEL.md)**: Modelo científico del biodigestor
- **[Resumen de Refactorización](Docs/REFACTORING_SUMMARY.md)**: Cambios recientes v2.0

---

## 🏗️ Arquitectura

```
Biogestor/
├── backend/          # Django REST API
├── frontend/         # React TypeScript
├── deploy/           # Configuraciones
├── Docs/             # Documentación
└── docker-compose.yml
```

### Características Principales

**✨ Tiempo Real**
- WebSockets para actualizaciones en vivo
- Notificaciones push
- Monitoreo de sensores en tiempo real

**🔧 IoT Escalable**
- Registro dinámico de n sensores/actuadores
- Protocolo MQTT
- Alertas automáticas por umbrales
- Gestión de calibraciones

**📊 Reportes Científicos**
- Modelo matemático validado
- Bibliografía científica
- Exportación PDF/Excel/CSV
- Análisis de producción real vs esperada

**🔐 Seguridad**
- Autenticación JWT
- Sistema de permisos por roles
- 0 vulnerabilidades (CodeQL verified)
- Variables de entorno para credenciales

**⚡ Performance**
- Caché con Redis
- Optimización de queries
- Multi-stage Docker builds
- Healthchecks integrados
## Vistas

<p align="center">
  <img src="https://github.com/CharFranR/Python/blob/main/Screenshot%202025-09-20%20193814.png?raw=true" alt="Main" width="800"/>
  <br><br>
  <img src="https://github.com/CharFranR/Python/blob/main/Screenshot%202025-09-20%20193825.png?raw=true" alt="Dashboard" width="800"/>
  <br><br>
  <img src="https://github.com/CharFranR/Python/blob/main/Screenshot%202025-09-20%20193848.png?raw=true" alt="Calculadora" width="800"/>
  <br><br>
  <img src="https://github.com/CharFranR/Python/blob/main/Screenshot%202025-09-20%20193835.png?raw=true" alt="Llenado" width="800"/>
  <br><br>
  <img src="https://github.com/CharFranR/Python/blob/main/Screenshot%202025-09-20%20193900.png?raw=true" alt="Asistente" width="800"/>
  <br><br>
  <img src="https://github.com/CharFranR/Python/blob/main/Screenshot%202025-09-20%20193914.png?raw=true" alt="Documentacion" width="800"/>
</p>


## Elaborado por:

- [CharFranR](https://github.com/CharFranR)
- [SProtector04](https://github.com/SProtector04)
- [ItsRhyas](https://github.com/ItsRhyas)
- [JeanCarlos28-CR](https://github.com/JeanCarlos28-CR)
- Penélope Martínez
