import json
import asyncio
from channels.generic.websocket import AsyncWebsocketConsumer
from datetime import datetime

class SensorsWebSocketConsumer(AsyncWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.sensor_groups = {}

    async def connect(self):
        await self.accept()
        print("WebSocket de sensores conectado")
        
        await self.send_sensor_list()
        
        asyncio.create_task(self.simulate_sensor_data())

    async def disconnect(self, close_code):
        print("WebSocket de sensores desconectado")

    async def receive(self, text_data):
        try:
            data = json.loads(text_data)
            message_type = data.get('type')
            
            if message_type == 'request_sensor_list':
                await self.send_sensor_list()
            elif message_type == 'subscribe':
                sensor_id = data.get('sensor_id')
                await self.subscribe_to_sensor(sensor_id)
            
        except json.JSONDecodeError:
            await self.send_error("Formato JSON inválido")

    async def send_sensor_list(self):
        sensor_list = {
            "type": "sensor_list",
            "charts": [
                {
                    "id": "temperature",
                    "title": "Temperatura",
                    "description": "Temperatura del biodigestor en tiempo real",
                    "unit": "°C",
                    "color": "#26a69a",
                    "icon": "fas fa-thermometer-half",
                    "currentValue": 37.5,
                    "status": "Estable"
                },
                {
                    "id": "ph",
                    "title": "Nivel de pH",
                    "description": "Seguimiento de la acidez/alcalinidad",
                    "unit": "pH",
                    "color": "#42a5f5",
                    "icon": "fas fa-flask",
                    "currentValue": 7.1,
                    "status": "Neutro"
                },
                {
                    "id": "pressure",
                    "title": "Presión de Gas",
                    "description": "Niveles de presión dentro del biodigestor",
                    "unit": "bar",
                    "color": "#ffa726",
                    "icon": "fas fa-tachometer-alt",
                    "currentValue": 1.1,
                    "status": "Óptima"
                },
                {
                    "id": "gas_production",
                    "title": "Producción de Biogás",
                    "description": "Volumen de biogás generado por día",
                    "unit": "m³/día",
                    "color": "#7e57c2",
                    "icon": "fas fa-gas-pump",
                    "currentValue": 23,
                    "status": "Alta"
                },
                {
                    "id": "humidity",
                    "title": "Humedad",
                    "description": "Nivel de humedad del sustrato",
                    "unit": "%",
                    "color": "#66bb6a",
                    "icon": "fas fa-tint",
                    "currentValue": 65,
                    "status": "Normal"
                }
            ]
        }
        
        await self.send(text_data=json.dumps(sensor_list))

    async def send_sensor_data(self, sensor_data):
        message = {
            "type": "sensor_data",
            "data": sensor_data,
            "timestamp": datetime.now().isoformat()
        }
        await self.send(text_data=json.dumps(message))

    async def send_error(self, error_message):
        message = {
            "type": "error",
            "data": error_message
        }
        await self.send(text_data=json.dumps(message))

    async def subscribe_to_sensor(self, sensor_id):
        print(f"Suscripto al sensor: {sensor_id}")

    async def simulate_sensor_data(self):
        import random
        
        while True:
            try:
                sensor_data = {
                    "temperature": 37.5 + (random.random() - 0.5) * 0.5,
                    "ph": 7.1 + (random.random() - 0.5) * 0.1,
                    "pressure": 1.1 + (random.random() - 0.5) * 0.05,
                    "gas_production": 23 + (random.random() - 0.5) * 2,
                    "humidity": 65 + (random.random() - 0.5) * 5
                }
                
                await self.send_sensor_data(sensor_data)
                await asyncio.sleep(2)
                
            except Exception as e:
                print(f"Error en simulación de datos: {e}")
                await asyncio.sleep(5)