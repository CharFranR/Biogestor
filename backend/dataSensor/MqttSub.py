import paho.mqtt.client as mqtt
import redis
from .models import Sensor
from .websocketService import send_sensors_data

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
    # Suscribir cada sensor por su mqtt_code
    for code in mqtt_code():
        connect_sensor(client, code)

def on_message(client, userdata, msg):
    print(msg.topic+" "+str(msg.payload))
    
    # Guardar el mensaje en Redis usando el topic como clave
    redis_client.rpush(msg.topic, msg.payload)
    redis_client.ltrim(msg.topic, -30, -1)

    send_sensors_data ()

mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_message = on_message

if __name__ == "__main__":
    mqttc.connect("mqtt.biogestor.cidtea", 1883, 60)
    mqttc.loop_forever()