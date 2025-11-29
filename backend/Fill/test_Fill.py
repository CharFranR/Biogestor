
from django.test import TestCase
from .models import Fill, FillPrediction
from django.utils import timezone

class FillPredictionModelTest(TestCase):
	def test_create_fill_prediction_with_lists(self):
		pred = FillPrediction.objects.create(
			total_solids=10.0,
			total_volatile_solids=5.0,
			potencial_production=20.0,
			max_mu=1.5,
			solvent_volume=100.0,
			initial_concentration=2.0,
			specific_mu=0.8,
			cumulative_production=[1.0, 2.0, 3.0],
			derivative_production=[0.1, 0.2, 0.3]
		)
		self.assertEqual(pred.cumulative_production, [1.0, 2.0, 3.0])
		self.assertEqual(pred.derivative_production, [0.1, 0.2, 0.3])

class FillModelTest(TestCase):
	def test_create_fill_with_prediction(self):
		pred = FillPrediction.objects.create(
			total_solids=10.0,
			total_volatile_solids=5.0,
			potencial_production=20.0,
			max_mu=1.5,
			solvent_volume=100.0,
			initial_concentration=2.0,
			specific_mu=0.8,
			cumulative_production=[1.0, 2.0, 3.0],
			derivative_production=[0.1, 0.2, 0.3]
		)
		fill = Fill.objects.create(
			first_day=timezone.now().date(),
			filling_mass=50.0,
			approx_density=1.2,
			added_watter=10.0,
			type_material=1.0,
			filling_moisture=0.5,
			delay_time=2.0,
			prediction=pred
		)
		self.assertEqual(fill.prediction, pred)
		self.assertEqual(fill.filling_mass, 50.0)
