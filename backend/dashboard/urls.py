from django.urls import path
from . import views
from .views import (
    CreateReportAPIView,
    RegenerateReportAPIView,
    StatsAPIView,
    ListFillingsAPIView,
    CloseCurrentFillingAPIView,
    ActuatorCommandAPIView,
    CalibrationAPIView,
    CalibrationExportAPIView,
    ReportByRangeAPIView,
    PredictEfficiencyAPIView,
    PracticeStatusAPIView,
    PracticeStartAPIView,
    PracticeStopAPIView,
)

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),
    path('report/create/', CreateReportAPIView.as_view(), name='create_report'),
    path('report/regenerate/<int:report_id>/', RegenerateReportAPIView.as_view(), name='regenerate_report'),
    path('fillings/', views.CreateFillingAPIView.as_view(), name='create_filling'),
    path('fillings/list/', ListFillingsAPIView.as_view(), name='list_fillings'),
    path('fillings/close-current/', CloseCurrentFillingAPIView.as_view(), name='close_current_filling'),
    path('production/current/', views.CurrentProductionAPIView.as_view(), name='current_production'),
    path('predict/efficiency/', PredictEfficiencyAPIView.as_view(), name='predict_efficiency'),
    path('report/by-range/', ReportByRangeAPIView.as_view(), name='report_by_range'),
    path('report/current/', views.CurrentReportAPIView.as_view(), name='current_report'),
    path('report/history/', views.ReportHistoryAPIView.as_view(), name='report_history'),
    path('report/download/<int:report_id>/<str:filetype>/', views.download_report_file, name='download_report_file'),
    path('actuators/command/', ActuatorCommandAPIView.as_view(), name='actuator_command'),
    path('calibrations/', CalibrationAPIView.as_view(), name='calibrations'),
    path('calibrations/export/', CalibrationExportAPIView.as_view(), name='calibrations_export'),
    path('stats/', StatsAPIView.as_view(), name='dashboard_stats'),
    path('practice/status/', PracticeStatusAPIView.as_view(), name='practice_status'),
    path('practice/start/', PracticeStartAPIView.as_view(), name='practice_start'),
    path('practice/stop/', PracticeStopAPIView.as_view(), name='practice_stop'),
]