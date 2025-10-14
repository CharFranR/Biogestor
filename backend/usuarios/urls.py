from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    crear_usuario,
    crear_institucion,
    ver_instituciones,
    IniciarSesionView,
    cerrar_sesion,
    aprobar_usuario,
    obtener_usuario_actual,
    listar_usuarios,
    usuarios_pendientes,
    ver_permisos_usuarios,
    cambiar_permisos
)

urlpatterns = [
    # Autenticación
    path('api/<str:nombre_institucion>/crear-usuario/', crear_usuario, name='crear_usuario'),
    path('api/iniciar-sesion/', IniciarSesionView.as_view(), name='iniciar_sesion'),
    path('api/cerrar-sesion/', cerrar_sesion, name='cerrar_sesion'),
    path('api/refrescar-token/', TokenRefreshView.as_view(), name='refrescar_token'),
    
    #Instituciones
    path('api/crear-institucion/', crear_institucion, name= 'crear_institucion'),
    path('api/ver-instituciones/', ver_instituciones, name= 'ver_instituciones'),

    # Usuarios
    path('api/usuario/actual/', obtener_usuario_actual,
         name='obtener_usuario_actual'),
    path('api/usuarios/', listar_usuarios, name='listar_usuarios'),
    path('api/usuarios/pendientes/', usuarios_pendientes,
         name='usuarios_pendientes'),
    path('api/usuario/<int:usuario_id>/aprobar/',
         aprobar_usuario, name='aprobar_usuario'),
    
     path('api/usuarios/<int:usuario_id>/ver-permisos/', ver_permisos_usuarios, name='ver_permisos'),
    
    path('api/usuarios/<int:usuario_id>/cambiar-permisos/', cambiar_permisos, name='cambiar_permisos'),
    
]
