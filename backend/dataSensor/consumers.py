from channels.generic.websocket import WebsocketConsumer
from asgiref.sync import async_to_sync
import redis
import json

redis_client = redis.Redis(host='redis', port=6379, db=0)

class dataSensorConsumer(WebsocketConsumer):
    def connect(self):
        async_to_sync(self.channel_layer.group_add)(
            "sensors_data",
            self.channel_name
        )
        self.accept()
        
        # Enviar datos actuales al conectar
        self.send_current_data()

    def send_current_data(self):
        """Enviar datos actuales de Redis al cliente cuando se conecta."""
        data = {}
        try:
            # Solo obtener claves de sensores (Biogestor/*)
            for key in redis_client.keys("Biogestor/*"):
                if redis_client.type(key) == b'list':
                    values = redis_client.lrange(key, 0, -1)
                    data[key.decode()] = [v.decode() for v in values]
        except Exception as e:
            print(f"Error reading Redis data: {e}")
        
        if data:
            self.send(text_data=json.dumps(data))

    def send_data(self, event):
        self.send(text_data=event["text"])

    def disconnect(self,code):
        async_to_sync(self.channel_layer.group_discard)(
        "sensors_data",
        self.channel_name
    )