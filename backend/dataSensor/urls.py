from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MeasuredVariableViewSet, SensorViewSet, DataViewSet

router = DefaultRouter()
router.register(r'measured-variables', MeasuredVariableViewSet)
router.register(r'sensors', SensorViewSet)
router.register(r'sensor-data', DataViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
