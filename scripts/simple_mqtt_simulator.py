#!/usr/bin/env python3
"""
Simple MQTT Sensor Simulator for Biogestor

Publishes simulated sensor data to the correct topics:
- Biogestor/temperatura
- Biogestor/presion  
- Biogestor/humedad

Usage:
    python scripts/simple_mqtt_simulator.py
    python scripts/simple_mqtt_simulator.py --broker localhost --port 1883 --interval 2
"""
import argparse
import math
import random
import signal
import sys
import time

import paho.mqtt.client as mqtt


def parse_args():
    parser = argparse.ArgumentParser(description="Simple MQTT sensor simulator for Biogestor")
    parser.add_argument("--broker", default="localhost", help="MQTT broker host (default: localhost)")
    parser.add_argument("--port", type=int, default=1883, help="MQTT broker port (default: 1883)")
    parser.add_argument("--interval", type=float, default=2.0, help="Seconds between messages (default: 2.0)")
    parser.add_argument("--duration", type=float, default=0.0, help="Total run time in seconds (0 = infinite)")
    return parser.parse_args()


def generate_sensor_data(t: float):
    """Generate realistic sensor readings."""
    # Temperatura: ~35°C con variación
    temp = 35.0 + 3.0 * math.sin(2 * math.pi * (t / 3600.0)) + random.uniform(-0.5, 0.5)
    
    # Presión: ~1010 hPa con variación
    pres = 1010.0 + 5.0 * math.sin(2 * math.pi * (t / 7200.0)) + random.uniform(-1.0, 1.0)
    
    # Humedad: ~65% con variación
    hum = 65.0 + 10.0 * math.sin(2 * math.pi * (t / 1800.0)) + random.uniform(-2.0, 2.0)
    
    # Calidad: 0-100 con variación
    calidad = 50.0 + 40.0 * math.sin(2 * math.pi * (t / 600.0)) + random.uniform(-5.0, 5.0)
    calidad = max(0, min(100, calidad))  # Clamp entre 0 y 100
    
    # Prueba1: 0-100 con variación aleatoria
    prueba1 = 50.0 + random.uniform(-30.0, 30.0)
    prueba1 = max(0, min(100, prueba1))  # Clamp entre 0 y 100
    
    # SP3: 0-100 con onda triangular
    sp3 = 50.0 + 30.0 * math.sin(2 * math.pi * (t / 300.0)) + random.uniform(-3.0, 3.0)
    sp3 = max(0, min(100, sp3))
    
    # SP4: 0-100 con variación más lenta
    sp4 = 50.0 + 25.0 * math.cos(2 * math.pi * (t / 900.0)) + random.uniform(-4.0, 4.0)
    sp4 = max(0, min(100, sp4))
    
    return {
        "temperatura": round(temp, 2),
        "presion": round(pres, 2),
        "humedad": round(hum, 2),
        "Calidad": round(calidad, 2),
        "Prueba1": round(prueba1, 2),
        "SP3": round(sp3, 2),
        "SP4": round(sp4, 2),
    }


def main():
    args = parse_args()
    
    print(f"Conectando a MQTT broker {args.broker}:{args.port}...")
    
    client = mqtt.Client(client_id="biogestor-simple-sim")
    
    def on_connect(cl, userdata, flags, rc, *extra):
        if rc == 0:
            print(f"✓ Conectado a {args.broker}:{args.port}")
        else:
            print(f"✗ Error de conexión: rc={rc}")
    
    client.on_connect = on_connect
    
    try:
        client.connect(args.broker, args.port, keepalive=60)
    except Exception as e:
        print(f"✗ Error conectando: {e}")
        return 1
    
    client.loop_start()
    
    running = True
    
    def handle_signal(signum, frame):
        nonlocal running
        running = False
        print("\n⏹ Deteniendo simulador...")
    
    signal.signal(signal.SIGINT, handle_signal)
    signal.signal(signal.SIGTERM, handle_signal)
    
    print(f"Publicando cada {args.interval} segundos en:")
    print("  - Biogestor/temperatura")
    print("  - Biogestor/presion")
    print("  - Biogestor/humedad")
    print("  - Biogestor/Calidad")
    print("  - Biogestor/Prueba1")
    print("  - Biogestor/SP3")
    print("  - Biogestor/SP4")
    print("\nPresiona Ctrl+C para detener\n")
    
    t0 = time.time()
    
    try:
        while running:
            elapsed = time.time() - t0
            data = generate_sensor_data(elapsed)
            
            for sensor_code, value in data.items():
                topic = f"Biogestor/{sensor_code}"
                # Publicar solo el valor numérico como string
                client.publish(topic, str(value), qos=0)
                print(f"  {topic} → {value}")
            
            print()
            
            if args.duration and elapsed >= args.duration:
                break
            
            time.sleep(args.interval)
    finally:
        client.loop_stop()
        client.disconnect()
        print("✓ Desconectado")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
