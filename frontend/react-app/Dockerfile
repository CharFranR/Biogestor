# Multi-stage build para aplicación React optimizada
# Etapa 1: Construcción de la aplicación
FROM node:20-alpine AS builder

# Variables de entorno para optimización
ENV NODE_ENV=production \
    NPM_CONFIG_LOGLEVEL=warn

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias (solo producción en CI, dev para build)
RUN npm ci --silent

# Copiar código fuente
COPY . .

# Construir aplicación optimizada
RUN npm run build

# Etapa 2: Servir aplicación con Nginx
FROM nginx:stable-alpine

# Metadata
LABEL maintainer="Biogestor Team"
LABEL description="Frontend React para sistema Biogestor"

# Copiar build desde etapa anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración personalizada de Nginx
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

# Crear usuario no-root para Nginx (seguridad)
RUN addgroup -g 1000 -S nginx-app && \
    adduser -u 1000 -S nginx-app -G nginx-app && \
    chown -R nginx-app:nginx-app /usr/share/nginx/html && \
    chown -R nginx-app:nginx-app /var/cache/nginx && \
    chown -R nginx-app:nginx-app /var/log/nginx && \
    chown -R nginx-app:nginx-app /etc/nginx/conf.d

# Cambiar permisos de directorios necesarios
RUN touch /var/run/nginx.pid && \
    chown -R nginx-app:nginx-app /var/run/nginx.pid

# Cambiar a usuario no-root
USER nginx-app

# Exponer puerto
EXPOSE 80

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/ || exit 1

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]