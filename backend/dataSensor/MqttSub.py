import paho.mqtt.client as mqtt
import redis
from .models import Sensor
from .websocketService import send_sendors_data

redis_client = redis.Redis(host='redis', port=6379, db=0)

def mqtt_code():
    mqtt_code = []
    all_sensors = Sensor.objects.all()

    for item in all_sensors:
        code = item.mqtt_code
        mqtt_code.append(code)

    return mqtt_code
   
def connect_sensor(client, mqtt_code):
    conection = f"Biogestor/{mqtt_code}"
    client.subscribe(conection)

def on_connect(client, userdata, flags, reason_code, properties):

    sensors = mqtt_code()

    for sensor in sensors:
        connect_sensor(client, sensor["mqtt_code"])

def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))
    
    # Guardar el mensaje en Redis usando el topic como clave
    redis_client.rpush(msg.topic, msg.payload)
    redis_client.ltrim(msg.topic, -30, -1)

    send_sendors_data ()

mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message

mqttc.connect("mqtt.biogestor.cidtea", 1883, 60)
mqttc.loop_forever()