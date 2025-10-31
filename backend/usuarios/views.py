from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db import models
from .serializers import (
    RegistrarUsuario,
    ValidarAprobacion,
    UsuarioSerializer,
    PermisosSerializer
)
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Permisos, Perfil
from .permisos import PuedeAprobarUsuarios

# Le sabe chapi a los views


# Enpoint para crear usuario
@api_view(['POST'])
@permission_classes([AllowAny])
def crear_usuario(request):
    # Crea un nuevo usuario pero sin aprobacion
    if request.method == 'POST':
        serializer = RegistrarUsuario(data=request.data)

        if serializer.is_valid():
            usuario = serializer.save()

            # Serializar el usuario creado para la respuesta
            usuario_serializer = UsuarioSerializer(usuario)

            return Response({
                'mensaje': 'Usuario registrado exitosamente. Espera aprobación del administrador.',
                'usuario': usuario_serializer.data
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Endpoint para iniciar sesión


class IniciarSesionView(TokenObtainPairView):
    """
    Inicia sesión y devuelve tokens + información del usuario
    """
    serializer_class = ValidarAprobacion

# Endpoint para cerrar sesióm


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cerrar_sesion(request):
    """
    Cierra sesión invalidando el token de refresh
    """
    try:
        # Obtener el token de refresh del cuerpo de la solicitud
        refresh_token = request.data.get('refresh_token')

        if not refresh_token:
            return Response(
                {'error': 'Token de refresh requerido'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Invalidar el token
        token = RefreshToken(refresh_token)
        token.blacklist()

        return Response({
            'mensaje': 'Sesión cerrada exitosamente'
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            {'error': 'Token inválido'},
            status=status.HTTP_400_BAD_REQUEST
        )

# Endpoint para aprobar usuarios


@api_view(['POST'])
@permission_classes([IsAuthenticated, PuedeAprobarUsuarios])
def aprobar_usuario(request, usuario_id):
    """
    Aprueba un usuario (solo para administradores)
    """
    # Permisos ya validados por decorator

    try:
        usuario = User.objects.get(id=usuario_id)

        # Verificar si el usuario tiene perfil
        if not hasattr(usuario, 'perfil'):
            return Response(
                {'error': 'El usuario no tiene perfil'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Aprobar el usuario
        usuario.perfil.aprobado = True
        usuario.perfil.save()

        # Serializar el usuario actualizado
        usuario_serializer = UsuarioSerializer(usuario)

        return Response({
            'mensaje': f'Usuario {usuario.username} aprobado exitosamente',
            'usuario': usuario_serializer.data
        })

    except User.DoesNotExist:
        return Response(
            {'error': 'Usuario no encontrado'},
            status=status.HTTP_404_NOT_FOUND
        )

# Endpoint para ver permisos por usuario

@api_view(['GET'])
@permission_classes([IsAuthenticated, PuedeAprobarUsuarios])
def ver_permisos_usuarios(request, usuario_id):
    try:
        usuario = User.objects.get(id=usuario_id)
        
        if not hasattr(usuario, 'perfil'):
            return Response ("No existe un perfil asociado al usuario")
        
        permisos = usuario.perfil.permisos
        
        serializer = PermisosSerializer(permisos)
        
        return Response ({
            "Usuario_id" : usuario_id,
            "UserName" : usuario.username,
            "Permisos" : serializer.data
        })
    except:
        return Response("Error al obtener permisos del usuario")



# Endpoint para cambiar permisos
@api_view(['POST'])
@permission_classes([IsAuthenticated, PuedeAprobarUsuarios])
def cambiar_permisos(request, usuario_id):
    """
    Cambian los permisos de un usuario
    """
    try:
        usuario = User.objects.get(id=usuario_id)
        permisos = usuario.perfil.permisos
        permisos_actualizados = request.data
        
        for campo, valor in permisos_actualizados.items():
            if hasattr(permisos, campo):
                setattr(permisos, campo, valor)
                
        permisos.save()
        
        serializer = PermisosSerializer(permisos)
        
        return Response({
            "Uusuario_id" : usuario_id,
            "Nombre" : usuario.username,
            "Permisos" : serializer.data
        })
        
    except User.DoesNotExist:
        return Response({'error': 'Los permisos no pudieron ser cambiados'}, status=404)



# Endpoint para obtener información del usuario


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_usuario_actual(request):
    """
    Obtiene la información del usuario autenticado
    """
    serializer = UsuarioSerializer(request.user)
    return Response(serializer.data)

# Endpoint para listar todos los usuarios


@api_view(['GET'])
@permission_classes([IsAuthenticated, PuedeAprobarUsuarios])  
def listar_usuarios(request):
    """
    Lista todos los usuarios aprobados (requiere permiso AprobarUsuarios)
    """
    # ✅ ELIMINA esta verificación manual
    # if not request.user.is_staff:
    #     return Response(
    #         {'error': 'No tienes permisos para realizar esta acción'},
    #         status=status.HTTP_403_FORBIDDEN
    #     )

    usuarios = User.objects.filter(perfil__aprobado=True)
    serializer = UsuarioSerializer(usuarios, many=True)

    return Response({
        'total': usuarios.count(),
        'usuarios': serializer.data
    })

# Endpoint para listar usuarios pendientes de aprobación
@api_view(['GET'])
@permission_classes([IsAuthenticated, PuedeAprobarUsuarios]) 
def usuarios_pendientes(request):
    """
    Lista usuarios pendientes de aprobación (requiere permiso AprobarUsuarios)
    """
    usuarios_pendientes = User.objects.filter(perfil__aprobado=False)
    serializer = UsuarioSerializer(usuarios_pendientes, many=True)

    return Response({
        'total_pendientes': usuarios_pendientes.count(),
        'usuarios': serializer.data
    })