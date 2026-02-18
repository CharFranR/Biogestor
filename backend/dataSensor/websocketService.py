from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
import redis

channel_layer = get_channel_layer()
redis_client = redis.Redis(host='redis', port=6379, db=0)


def send_sensors_data():
    """Send sensor data from Redis to WebSocket clients."""
    data = {}
    # Solo obtener claves que son topics MQTT (Biogestor/*)
    for key in redis_client.keys("Biogestor/*"):
        try:
            # Verificar que la clave es de tipo lista antes de usar lrange
            if redis_client.type(key) == b'list':
                values = redis_client.lrange(key, 0, -1)
                data[key.decode()] = [v.decode() for v in values]
        except Exception as e:
            print(f"Error reading key {key}: {e}")
            continue
    
    if data:
        async_to_sync(channel_layer.group_send)(
            "sensors_data",
            {
                "type": "send_data",
                "text": json.dumps(data)
            }
        )
