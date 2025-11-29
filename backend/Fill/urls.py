from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import FillViewSet

router = DefaultRouter()
router.register(r'Fill', FillViewSet, basename = 'Fill')

url_pattern = [
    path('', include(router.urls)),
]