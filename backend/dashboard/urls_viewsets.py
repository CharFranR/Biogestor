"""
URLs con ViewSets para el módulo dashboard.

Este módulo utiliza routers de Django REST Framework para generar
automáticamente los endpoints REST estándar.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views
from .viewsets import (
    FillingStageViewSet,
    SensorReadingViewSet,
    ReportViewSet,
    ActuatorCommandViewSet,
    AlertViewSet,
    CalibrationRecordViewSet,
    PracticeSessionViewSet
)

# Crear router y registrar viewsets
router = DefaultRouter()
router.register(r'fillings', FillingStageViewSet, basename='filling')
router.register(r'sensors', SensorReadingViewSet, basename='sensor')
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'actuators', ActuatorCommandViewSet, basename='actuator')
router.register(r'alerts', AlertViewSet, basename='alert')
router.register(r'calibrations', CalibrationRecordViewSet, basename='calibration')
router.register(r'practices', PracticeSessionViewSet, basename='practice')

# URLs adicionales que no se ajustan al patrón REST estándar
urlpatterns = [
    # Dashboard principal
    path('', views.dashboard_view, name='dashboard'),
    
    # Endpoints de estadísticas y producción
    path('stats/', views.StatsAPIView.as_view(), name='dashboard_stats'),
    path('production/current/', views.CurrentProductionAPIView.as_view(), name='current_production'),
    path('predict/efficiency/', views.PredictEfficiencyAPIView.as_view(), name='predict_efficiency'),
    
    # Endpoints de reportes adicionales
    path('report/by-range/', views.ReportByRangeAPIView.as_view(), name='report_by_range'),
    path('report/current/', views.CurrentReportAPIView.as_view(), name='current_report'),
    path('report/regenerate/<int:report_id>/', views.RegenerateReportAPIView.as_view(), name='regenerate_report'),
    
    # Incluir rutas del router
    path('', include(router.urls)),
]
