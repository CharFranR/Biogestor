from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import itemsViewSet

router = DefaultRouter()

router.register(r'items', itemsViewSet, basename='items')

urlpatterns = router.urls