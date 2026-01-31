import paho.mqtt.client as mqtt
import redis

redis_client = redis.Redis(host='redis', port=6379, db=0)

def get_sensor_codes():
    """Get all sensor mqtt_codes from database."""
    from .models import Sensor
    return [sensor.mqtt_code for sensor in Sensor.objects.all()]

def send_ws_update():
    """Send WebSocket update to connected clients."""
    from .websocketService import send_sensors_data
    send_sensors_data()

def start_save_data_thread():
    """Start the data saving thread."""
    from .views import start_save_data_thread as _start
    return _start()
   
def connect_sensor(client, mqtt_code):
    conection = f"Biogestor/{mqtt_code}"
    client.subscribe(conection)

def on_connect(client, userdata, flags, reason_code, properties):
    # Suscribir cada sensor por su mqtt_code
    for code in get_sensor_codes():
        connect_sensor(client, code)

def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))
    
    # Guardar el mensaje en Redis usando el topic como clave
    redis_client.rpush(msg.topic, msg.payload)
    redis_client.ltrim(msg.topic, -30, -1)

    send_ws_update()

try:
    mqttc = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)  # type: ignore[attr-defined]
except Exception:
    mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message