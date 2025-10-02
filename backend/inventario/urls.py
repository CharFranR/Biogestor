from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductoViewSet,
    InsumoViewSet,
    CrearProductoConInsumosView,
    obtener_insumos
)

router = DefaultRouter()
router.register(r'productos', ProductoViewSet)
router.register(r'insumos', InsumoViewSet)

urlpatterns = [

    # endpoints extra:
    path('productos/crear_con_insumos/',
         CrearProductoConInsumosView.as_view(), name='crear-producto-insumos'),
    path('producto-insumos/', obtener_insumos, name='obtener-insumos'),

    path('', include(router.urls)),  # Cruds automaticos
]
