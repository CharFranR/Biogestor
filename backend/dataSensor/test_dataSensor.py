from django.test import TestCase
from .models import Sensor, Data, MeasuredVariable
import redis
import json
from unittest.mock import patch

class SensorModelTest(TestCase):
	def test_create_sensor(self):
		from datetime import date
		mv = MeasuredVariable.objects.create(name="Temperatura")
		sensor = Sensor.objects.create(
			name="SensorA",
			mqtt_code="sensorA",
			measured_variable=mv,
			suscription_date=date.today(),
			min_range=0.0,
			max_range=100.0,
		)
		self.assertEqual(sensor.name, "SensorA")
		self.assertEqual(sensor.mqtt_code, "sensorA")

class DataModelTest(TestCase):
	def test_create_data(self):
		from datetime import date
		mv = MeasuredVariable.objects.create(name="Presion")
		sensor = Sensor.objects.create(
			name="SensorB",
			mqtt_code="sensorB",
			measured_variable=mv,
			suscription_date=date.today(),
			min_range=0.0,
			max_range=10.0,
		)
		data = Data.objects.create(sensor=sensor, value=42.5)
		self.assertEqual(data.sensor, sensor)
		self.assertEqual(data.value, 42.5)

class RedisCacheTest(TestCase):
	@patch('redis.Redis')
	def test_save_and_retrieve_sensor_data(self, mock_redis):
		mock_instance = mock_redis.return_value
		mock_instance.rpush.return_value = None
		mock_instance.ltrim.return_value = None
		mock_instance.lrange.return_value = [b'12.3', b'13.4']

		# Simula guardado en Redis
		mock_instance.rpush('Biogestor/sensorA', b'12.3')
		mock_instance.rpush('Biogestor/sensorA', b'13.4')
		mock_instance.ltrim('Biogestor/sensorA', -30, -1)

		# Simula recuperación de historial
		values = mock_instance.lrange('Biogestor/sensorA', 0, -1)
		self.assertEqual([v.decode() for v in values], ['12.3', '13.4'])

class MQTTProcessingTest(TestCase):
	@patch('dataSensor.websocketService.send_sensors_data')
	@patch('redis.Redis')
	def test_on_message_processing(self, mock_redis, mock_send):
		from .MqttSub import on_message
		mock_instance = mock_redis.return_value
		mock_instance.rpush.return_value = None
		mock_instance.ltrim.return_value = None
		msg = type('msg', (), {'topic': 'Biogestor/sensorA', 'payload': b'15.6'})
		on_message(None, None, msg)
		mock_instance.rpush.assert_called_with('Biogestor/sensorA', b'15.6')
		mock_instance.ltrim.assert_called_with('Biogestor/sensorA', -30, -1)
		mock_send.assert_called()

class WebSocketServiceTest(TestCase):
	@patch('channels.layers.get_channel_layer')
	@patch('redis.Redis')
	def test_send_sensors_data(self, mock_redis, mock_channel_layer):
		from dataSensor.websocketService import send_sensors_data
		import asyncio
		mock_instance = mock_redis.return_value
		mock_instance.keys.return_value = [b'Biogestor/sensorA']
		mock_instance.lrange.return_value = [b'10.1', b'10.2']
		async def async_mock(*args, **kwargs):
			return None
		mock_channel_layer.return_value.group_send = async_mock
		send_sensors_data()

class SaveDataProcessTest(TestCase):
	@patch('dataSensor.views.redis_client')
	def test_save_data_iteration(self, mock_redis_client):
		from dataSensor.views import save_data_iteration
		from datetime import date
		mv = MeasuredVariable.objects.create(name="Temp")
		s1 = Sensor.objects.create(name="S1", mqtt_code="sensorA", measured_variable=mv,
								   suscription_date=date.today(), min_range=0.0, max_range=100.0)
		s2 = Sensor.objects.create(name="S2", mqtt_code="sensorB", measured_variable=mv,
								   suscription_date=date.today(), min_range=0.0, max_range=100.0)

		def lindex_side_effect(key, idx):
			if key == f"Biogestor/{s1.mqtt_code}":
				return b"12.5"
			if key == f"Biogestor/{s2.mqtt_code}":
				return b"8.75"
			return None

		mock_redis_client.lindex.side_effect = lindex_side_effect

		save_data_iteration()

		self.assertEqual(Data.objects.filter(sensor=s1).count(), 1)
		self.assertEqual(Data.objects.filter(sensor=s2).count(), 1)
		self.assertAlmostEqual(Data.objects.filter(sensor=s1).first().value, 12.5)
		self.assertAlmostEqual(Data.objects.filter(sensor=s2).first().value, 8.75)

class WebSocketServiceMultiSensorsTest(TestCase):
	@patch('dataSensor.websocketService.redis_client')
	def test_send_sendors_data_multiple(self, mock_redis_client):
		from dataSensor.websocketService import send_sensors_data
		import asyncio, json

		# Mock redis client with two sensors
		mock_redis_client.keys.return_value = [b'Biogestor/sensorA', b'Biogestor/sensorB']

		def lrange_side_effect(key, start, end):
			if key == b'Biogestor/sensorA':
				return [b'10.1', b'10.2']
			if key == b'Biogestor/sensorB':
				return [b'20.1', b'20.2']
			return []

		mock_redis_client.lrange.side_effect = lrange_side_effect

		# Capture group_send payload by patching channel_layer directly
		from dataSensor import websocketService as ws

		captured = {}
		async def group_send_mock(group, message):
			captured['group'] = group
			captured['message'] = message
			return None

		ws.channel_layer.group_send = group_send_mock

		asyncio.get_event_loop().run_until_complete(group_send_mock("sensors_data", {"type":"send_data","text":"{}"}))
		# Execute
		send_sensors_data()

		self.assertEqual(captured.get('group'), 'sensors_data')
		payload = captured.get('message', {})
		self.assertEqual(payload.get('type'), 'send_data')
		data = json.loads(payload.get('text', '{}'))
		self.assertIn('Biogestor/sensorA', data)
		self.assertIn('Biogestor/sensorB', data)
		self.assertEqual(data['Biogestor/sensorA'], ['10.1', '10.2'])
		self.assertEqual(data['Biogestor/sensorB'], ['20.1', '20.2'])
