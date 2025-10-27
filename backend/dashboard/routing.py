from django.urls import re_path
from . import consumer
from . import sensors_consumer

websocket_urlpatterns = [
    re_path(r'ws/mqtt/$', consumer.MQTTWebSocketConsumer.as_asgi()),
    re_path(r'ws/sensors/$', sensors_consumer.SensorsWebSocketConsumer.as_asgi()),
]