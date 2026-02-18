FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Instala watchdog en build time, no runtime
RUN pip install watchdog

COPY . .

EXPOSE 8000