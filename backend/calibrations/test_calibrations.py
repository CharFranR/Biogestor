# importaciones necesarias
import pytest
from django.utils import timezone
from .models import Calibration

@pytest.mark.django_db
def test_create_calibration():
	calibration = Calibration.objects.create(
		userId=1.0,
		sensorId=2.0,
		date=timezone.now().date(),
		params='{"param1": 10}',
		note='Test note',
		result='Success',
		previous_calibration=timezone.now().date()
	)
	assert calibration.pk is not None
	assert calibration.userId == 1.0
	assert calibration.sensorId == 2.0
	assert calibration.note == 'Test note'

@pytest.mark.django_db
def test_str_fields():
	calibration = Calibration.objects.create(
		userId=2.0,
		sensorId=3.0,
		date=timezone.now().date(),
		params='{"param2": 20}',
		note='Another note',
		result='Failed',
		previous_calibration=timezone.now().date()
	)
	assert isinstance(calibration.params, str)
	assert isinstance(calibration.note, str)
	assert isinstance(calibration.result, str)
