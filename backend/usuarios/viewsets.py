"""
ViewSets para el módulo de usuarios.

Proporciona gestión de usuarios, perfiles y permisos mediante ViewSets.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from django.contrib.auth.models import User
from django.db.models import Q

from .models import Perfil, Permisos
from .serializers import UsuarioSerializer, PermisosSerializer
from .permisos import PuedeAprobarUsuarios


class Permisos ViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de permisos.
    
    Permite crear y gestionar conjuntos de permisos que pueden
    ser asignados a perfiles de usuario.
    """
    queryset = Permisos.objects.all()
    serializer_class = PermisosSerializer
    permission_classes = [IsAuthenticated, IsAdminUser]
    
    def get_queryset(self):
        """
        Filtra permisos accesibles para el usuario actual.
        Los administradores ven todos, otros solo los propios.
        """
        if self.request.user.is_staff or self.request.user.is_superuser:
            return Permisos.objects.all()
        
        # Usuarios no admin solo ven sus propios permisos
        try:
            perfil = self.request.user.perfil
            return Permisos.objects.filter(id=perfil.permisos.id)
        except:
            return Permisos.objects.none()


class PerfilViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de perfiles de usuario.
    
    Los perfiles extienden el modelo User de Django con información
    adicional como rol, permisos y estado de aprobación.
    """
    queryset = Perfil.objects.all()
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Personaliza el queryset según el usuario:
        - Admins: ven todos los perfiles
        - Usuarios regulares: solo su propio perfil
        """
        user = self.request.user
        
        if user.is_staff or user.is_superuser:
            return Perfil.objects.all()
        
        # Usuarios regulares solo ven su perfil
        try:
            return Perfil.objects.filter(user=user)
        except:
            return Perfil.objects.none()
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, PuedeAprobarUsuarios])
    def approve(self, request, pk=None):
        """
        Aprueba un perfil de usuario pendiente.
        
        Solo accesible por usuarios con el permiso 'AprobarUsuarios'.
        """
        perfil = self.get_object()
        
        if perfil.aprobado:
            return Response(
                {"detail": "El usuario ya está aprobado"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        perfil.aprobado = True
        perfil.save()
        
        return Response({
            "detail": f"Usuario {perfil.user.username} aprobado exitosamente",
            "perfil_id": perfil.id
        })
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, PuedeAprobarUsuarios])
    def reject(self, request, pk=None):
        """
        Rechaza un perfil de usuario pendiente.
        
        Marca el perfil como no aprobado.
        """
        perfil = self.get_object()
        
        perfil.aprobado = False
        perfil.save()
        
        return Response({
            "detail": f"Usuario {perfil.user.username} rechazado",
            "perfil_id": perfil.id
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, PuedeAprobarUsuarios])
    def pending(self, request):
        """
        Lista todos los perfiles pendientes de aprobación.
        """
        perfiles = Perfil.objects.filter(aprobado=False)
        # Serializar con información del usuario
        data = []
        for perfil in perfiles:
            data.append({
                'id': perfil.id,
                'username': perfil.user.username,
                'email': perfil.user.email,
                'first_name': perfil.user.first_name,
                'last_name': perfil.user.last_name,
                'rol': perfil.rol,
                'fecha_registro': perfil.user.date_joined,
            })
        
        return Response(data)


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gestión de usuarios del sistema.
    
    Proporciona operaciones CRUD sobre usuarios, con control de permisos
    adecuado para que usuarios solo puedan ver/modificar su propia información
    (excepto administradores).
    """
    queryset = User.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Personaliza queryset según permisos:
        - Administradores: todos los usuarios
        - Usuarios regulares: solo ellos mismos
        """
        user = self.request.user
        
        if user.is_staff or user.is_superuser:
            return User.objects.all()
        
        # Usuario regular solo ve su cuenta
        return User.objects.filter(id=user.id)
    
    def get_permissions(self):
        """
        Personaliza permisos por acción:
        - create: permite registro público
        - otros: requiere autenticación
        """
        if self.action == 'create':
            return [AllowAny()]
        return [IsAuthenticated()]
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """
        Obtiene información del usuario autenticado actual.
        
        Incluye datos del perfil y permisos.
        """
        user = request.user
        try:
            perfil = user.perfil
            permisos = perfil.permisos
            
            return Response({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff,
                'perfil': {
                    'id': perfil.id,
                    'aprobado': perfil.aprobado,
                    'rol': perfil.rol,
                    'rol_display': perfil.get_rol_display(),
                },
                'permisos': {
                    'AprobarUsuarios': permisos.AprobarUsuarios,
                    'VerReportes': permisos.VerReportes,
                    'GenerarReportes': permisos.GenerarReportes,
                    'VerDashboard': permisos.VerDashboard,
                    'VerCalibraciones': permisos.VerCalibraciones,
                    'VerInventario': permisos.VerInventario,
                    'ModificarInventario': permisos.ModificarInventario,
                }
            })
        except Exception as e:
            return Response(
                {"detail": f"Error obteniendo información de usuario: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_permisos(self, request, pk=None):
        """
        Actualiza permisos de un usuario.
        
        Solo accesible por administradores.
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "No tienes permisos para modificar permisos de usuarios"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        try:
            perfil = user.perfil
            permisos = perfil.permisos
            
            # Actualizar permisos desde request data
            for key, value in request.data.items():
                if hasattr(permisos, key) and isinstance(value, bool):
                    setattr(permisos, key, value)
            
            permisos.save()
            
            return Response({
                "detail": "Permisos actualizados exitosamente",
                "permisos": PermisosSerializer(permisos).data
            })
        except Exception as e:
            return Response(
                {"detail": f"Error actualizando permisos: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def change_role(self, request, pk=None):
        """
        Cambia el rol de un usuario.
        
        Solo accesible por administradores.
        Roles válidos: ADMIN, COLAB, VISIT
        """
        if not (request.user.is_staff or request.user.is_superuser):
            return Response(
                {"detail": "No tienes permisos para modificar roles"},
                status=status.HTTP_403_FORBIDDEN
            )
        
        user = self.get_object()
        new_role = request.data.get('rol')
        
        if new_role not in ['ADMIN', 'COLAB', 'VISIT']:
            return Response(
                {"detail": "Rol inválido. Valores permitidos: ADMIN, COLAB, VISIT"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            perfil = user.perfil
            perfil.rol = new_role
            perfil.save()
            
            return Response({
                "detail": f"Rol actualizado a {perfil.get_rol_display()}",
                "rol": perfil.rol
            })
        except Exception as e:
            return Response(
                {"detail": f"Error actualizando rol: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated, IsAdminUser])
    def stats(self, request):
        """
        Obtiene estadísticas de usuarios del sistema.
        
        Solo accesible por administradores.
        """
        total_users = User.objects.count()
        pending_approval = Perfil.objects.filter(aprobado=False).count()
        approved_users = Perfil.objects.filter(aprobado=True).count()
        
        # Contar por rol
        admins = Perfil.objects.filter(rol='ADMIN').count()
        colaboradores = Perfil.objects.filter(rol='COLAB').count()
        visitantes = Perfil.objects.filter(rol='VISIT').count()
        
        return Response({
            'total_usuarios': total_users,
            'pendientes_aprobacion': pending_approval,
            'usuarios_aprobados': approved_users,
            'por_rol': {
                'administradores': admins,
                'colaboradores': colaboradores,
                'visitantes': visitantes,
            }
        })
