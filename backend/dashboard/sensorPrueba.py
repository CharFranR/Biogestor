import paho.mqtt.client as mqtt
import random
import time
import json

broker = "localhost"
port = 1883
topic = "Prueba"

def on_connect(client, userdata, flags, rc):
    print(f"CALLBACK on_connect llamado - Codigo: {rc}")
    if rc == 0:
        print("Conexion MQTT establecida correctamente")
        datos = generar_datos_aleatorios()
        mensaje = json.dumps(datos)
        client.publish(topic, mensaje)
        print(f"Primer mensaje publicado: {mensaje}")
    else:
        print(f"Error de conexion MQTT: {rc}")

def on_publish(client, userdata, mid):
    print(f"CALLBACK on_publish - Mensaje ID {mid} confirmado")

def on_disconnect(client, userdata, rc):
    print(f"CALLBACK on_disconnect - Codigo: {rc}")

def generar_datos_aleatorios():
    return {
        "temperatura": round(random.uniform(20.0, 35.0), 2),
        "humedad": round(random.uniform(40.0, 80.0), 2),
        "presion": round(random.uniform(1000.0, 1020.0), 2),
        "timestamp": time.time()
    }

client = mqtt.Client()
print("Cliente MQTT creado")

client.on_connect = on_connect
client.on_publish = on_publish
client.on_disconnect = on_disconnect

try:
    print(f"Conectando a {broker}:{port}...")
    client.connect(broker, port, 60)
    print("Connect() llamado, iniciando loop...")
    
    client.loop_start()
    print("Loop iniciado")
    
    counter = 0
    while True:
        time.sleep(5)
        if counter > 0:
            datos = generar_datos_aleatorios()
            mensaje = json.dumps(datos)
            result = client.publish(topic, mensaje)
            print(f"Publicado mensaje {counter}: {mensaje}")
            print(f"Resultado publish: {result.rc}")
        counter += 1
        
except KeyboardInterrupt:
    print("Deteniendo sensor...")
    client.loop_stop()
    client.disconnect()
except Exception as e:
    print(f"Error general: {e}")
    import traceback
    traceback.print_exc()