from django.urls import re_path
from . import consumer

websocket_urlpatterns = [
    re_path(r'ws/mqtt/$', consumer.MQTTWebSocketConsumer.as_asgi()),
]