#!/usr/bin/env python
"""
Script to run MQTT subscriber as standalone process.
Sets up Django environment before importing the subscriber module.
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.insert(0, '/app')

# Setup Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'BGProject.settings')
django.setup()

# Now import and run the MQTT subscriber
from dataSensor.MqttSub import mqttc, start_save_data_thread

if __name__ == "__main__":
    print("Starting data save thread...")
    start_save_data_thread()
    
    print("Connecting to MQTT broker...")
    mqttc.connect("mosquitto", 1883, 60)
    
    print("MQTT subscriber running...")
    mqttc.loop_forever()
