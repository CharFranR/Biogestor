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

    def send_data(self, event):
        self.send(text_data=event["text"])

    def disconnect(self,code):
        async_to_sync(self.channel_layer.group_discard)(
        "sensors_data",
        self.channel_name
    )