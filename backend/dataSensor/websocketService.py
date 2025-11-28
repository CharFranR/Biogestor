from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
import json
import redis

channel_layer = get_channel_layer()
redis_client = redis.Redis(host='redis', port=6379, db=0)


def send_sendors_data ():
        data = {}
        for key in redis_client.keys():
            values = redis_client.lrange(key, 0, -1)
            data[key.decode()] = [v.decode() for v in values]
        async_to_sync(channel_layer.group_send)(
            "sensors_data",
            {
                "type": "send_data",
                "text": json.dumps(data)
            }
        )
