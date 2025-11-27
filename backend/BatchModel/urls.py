from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BasicParamsViewSet

router = DefaultRouter()

router.register(r'BasicParams', BasicParamsViewSet, basename = 'BasicParamsViewSet')

urlpatterns = [
    path('', include(router.urls)),
] 
