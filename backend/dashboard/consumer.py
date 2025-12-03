import asyncio
import json
import os
from channels.generic.websocket import AsyncWebsocketConsumer
import paho.mqtt.client as mqtt
from django.utils import timezone
from .models import FillingStage, SensorReading

class MQTTWebSocketConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.mqtt_client = None
        self._event_loop = None

    async def connect(self):
        print("PASO 1: WebSocket intentando conectar...")
        await self.accept()
        print("PASO 1: WebSocket CONECTADO")
        
        self._event_loop = asyncio.get_event_loop()
        
        self.mqtt_client = mqtt.Client()
        self.mqtt_client.on_connect = self._on_mqtt_connect
        self.mqtt_client.on_message = self._on_mqtt_message
        
        try:
            print("PASO 2: Conectando a MQTT...")
            broker_host = os.getenv("MQTT_BROKER_HOST", "mosquitto")
            broker_port = int(os.getenv("MQTT_BROKER_PORT", "1883"))
            self.mqtt_client.connect(broker_host, broker_port, 60)
            self.mqtt_client.loop_start()
            print("PASO 2: MQTT loop iniciado")
        except Exception as e:
            print(f"Error MQTT: {e}")

    async def disconnect(self, close_code):
        print("WebSocket desconectado")
        if self.mqtt_client:
            self.mqtt_client.loop_stop()

    def _on_mqtt_connect(self, client, userdata, flags, rc):
        print(f"PASO 3: Callback MQTT connect, codigo: {rc}")
        if rc == 0:
            print("PASO 3: MQTT CONECTADO al broker")
            client.subscribe("Prueba")
            print("SUSCRITO al topic 'Prueba'")
        else:
            print(f"MQTT connection failed: {rc}")

    def _on_mqtt_message(self, client, userdata, msg):
        print(f"PASO 4: Mensaje MQTT RECIBIDO - Topic: {msg.topic}")
        print(f"Payload: {msg.payload}")
        
        try:
            data = json.loads(msg.payload.decode())
            print(f"JSON parseado: {data}")
            
            # Enviar todos los campos numéricos del mensaje MQTT
            filtered_data = {
                'type': 'sensor_data'
            }
            
            # Agregar todos los campos numéricos del mensaje MQTT
            for key, value in data.items():
                if isinstance(value, (int, float)):
                    filtered_data[key] = value

            # Persistencia en DB (si hay etapa activa)
            try:
                stage = FillingStage.objects.filter(active=True).order_by('-created_at').first()
                if stage is not None:
                    pressure = None
                    if 'presion' in data:
                        # Los ejemplos vienen en hPa (p.ej. 1006.65)
                        pressure = float(data.get('presion'))
                    biol_flow = None
                    gas_flow = None
                    # Opcionales: caudalímetros si existen en payload
                    for k in ['caudal_biol', 'biol_flow']:
                        if k in data and isinstance(data[k], (int, float)):
                            biol_flow = float(data[k])
                            break
                    for k in ['caudal_gas', 'gas_flow']:
                        if k in data and isinstance(data[k], (int, float)):
                            gas_flow = float(data[k])
                            break

                    SensorReading.objects.create(
                        stage=stage,
                        timestamp=timezone.now(),
                        pressure_hpa=pressure,
                        biol_flow=biol_flow,
                        gas_flow=gas_flow,
                        raw_payload=data
                    )

                    # Reglas simples de alerta (umbrales)
                    # ALERTAS ELIMINADAS
            except Exception as db_err:
                print(f"Error guardando lectura de sensor: {db_err}")

            print(f"PASO 5: Enviando via WebSocket: {filtered_data}")
            
            asyncio.run_coroutine_threadsafe(self._send_to_websocket(filtered_data), self._event_loop)
            
        except Exception as e:
            print(f"Error: {e}")

    async def _send_to_websocket(self, data):
        try:
            await self.send(text_data=json.dumps(data))
            print("PASO 6: Mensaje ENVIADO via WebSocket")
        except Exception as e:
            print(f"Error enviando WebSocket: {e}")
