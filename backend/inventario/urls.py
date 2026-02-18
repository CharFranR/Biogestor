from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import itemsViewSet, placesViewSet

router = DefaultRouter()

router.register(r'items', itemsViewSet, basename='items')
router.register(r'place', placesViewSet, basename='place')


urlpatterns = [
    path('',include(router.urls)),
]