from django.urls import path
from . import views
from .views import CreateReportAPIView, RegenerateReportAPIView, StatsAPIView

urlpatterns = [
    path('', views.dashboard_view, name='dashboard'),
    path('report/create/', CreateReportAPIView.as_view(), name='create_report'),
    path('report/regenerate/<int:report_id>/', RegenerateReportAPIView.as_view(), name='regenerate_report'),
    path('fillings/', views.CreateFillingAPIView.as_view(), name='create_filling'),
    path('production/current/', views.CurrentProductionAPIView.as_view(), name='current_production'),
    path('report/current/', views.CurrentReportAPIView.as_view(), name='current_report'),
    path('report/history/', views.ReportHistoryAPIView.as_view(), name='report_history'),
    path('report/download/<int:report_id>/<str:filetype>/', views.download_report_file, name='download_report_file'),
    path('stats/', StatsAPIView.as_view(), name='dashboard_stats'),
]