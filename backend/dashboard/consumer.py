import asyncio
import json
from channels.generic.websocket import AsyncWebsocketConsumer
import paho.mqtt.client as mqtt

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
            self.mqtt_client.connect("localhost", 1883, 60)
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
            
            filtered_data = {
                'type': 'sensor_data',
                'temperatura': data.get('temperatura'),
                'humedad': data.get('humedad')
            }
            
            print(f"PASO 5: Enviando via WebSocket: {filtered_data}")
            
            asyncio.run_coroutine_threadsafe(
                self._send_to_websocket(filtered_data),
                self._event_loop
            )
            
        except Exception as e:
            print(f"Error: {e}")

    async def _send_to_websocket(self, data):
        try:
            await self.send(text_data=json.dumps(data))
            print("PASO 6: Mensaje ENVIADO via WebSocket")
        except Exception as e:
            print(f"Error enviando WebSocket: {e}")