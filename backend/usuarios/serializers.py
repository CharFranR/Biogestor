from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import Perfil, Permisos, Instituciones
from django.core.cache import cache
from django.db import models

class PerfilSerializer (serializers.ModelSerializer):
    institucion = serializers.CharField(source='institucion.Nombre', read_only=True)
    class Meta:
        model = Perfil
        fields = ["aprobado", "institucion"]


class UsuarioSerializer (serializers.ModelSerializer):
    perfil = PerfilSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email",
                  "first_name", "last_name", "perfil"]
        
class PermisosSerializer (serializers.ModelSerializer):
    class Meta:
        model = Permisos
        fields = '__all__'

class InstitucionesSerializer (serializers.ModelSerializer):
    class Meta:
        model = Instituciones
        fields = ['Nombre', 'FechaIngreso']

class ValidarAprobacion (TokenObtainPairSerializer):

    # Cuando llamamos a data = super().validate(attrs) esta hace una serie de comprobaciones
    # 1. Comprueba si el usuario y contraseña de attrs pertenece a un Usuario y de ser así devuelve el token
    # del usuario, como si ejecuta user = authenticate(username=username, password=password)
    # 2. Si se valida el usuario establece self.user = user

    def validate(self, attrs):

        data = super().validate(attrs)

        if hasattr(self.user, 'perfil') and not self.user.perfil.aprobado:
            raise serializers.ValidationError({
                "detail": "Tu cuenta está pendiente de aprobación."
            })

        datos_usuario = UsuarioSerializer(self.user)
        data['user'] = datos_usuario.data

        return data

class RegistrarUsuario(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    email = serializers.EmailField(required=True)
    nombre_institucion = serializers.CharField(read_only=True)

    class Meta:
        model = User
        fields = [
            'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'nombre_institucion'
        ]
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("El correo ya tiene una cuenta asociada")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Este nombre de usuario ya está en uso")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({"password": "Las contraseñas no coinciden"})
        return attrs

    def create(self, validated_data):
        nombre_institucion = self.context.get('nombre_institucion')
        validated_data.pop('password2')

        print(f"🔍 DEBUG Serializer - nombre_institucion: {nombre_institucion}")

        # Crear usuario
        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

        # Verificar institución
        try:
            institucion = Instituciones.objects.get(Nombre=nombre_institucion)
        except Instituciones.DoesNotExist:
            raise serializers.ValidationError(
                {"institucion": f"La institución '{nombre_institucion}' no existe"}
            )

        # Crear permisos
        permisos = Permisos.objects.create()

        # Verificar si es el primer usuario en esta institución
        usuarios_en_institucion = User.objects.filter(perfil__institucion=institucion).count()
        es_primer_usuario_en_institucion = usuarios_en_institucion == 0

        if es_primer_usuario_en_institucion:
            # Hacerlo staff y superusuario
            user.is_staff = True
            user.is_superuser = True
            user.save()

            # Activar todos los permisos
            for field in permisos._meta.fields:
                if isinstance(field, models.BooleanField) and field.name != 'id':
                    setattr(permisos, field.name, True)
            permisos.save()

            # Aprobar automáticamente al primer usuario de la institución
            aprobado = True
        else:
            aprobado = False

        # Crear perfil
        perfil = Perfil.objects.create(
            user=user,
            permisos=permisos,
            institucion=institucion,
            aprobado=aprobado  
        )

        print(f"✅ Perfil creado para {user.username} en institución {institucion.Nombre}")

        return user

{
    "username": "usuario123",
    "password": "contraseñaSegura123",
    "password2": "contraseñaSegura123",
    "email": "usuario@ejemplo.com",
    "first_name": "Juan",
    "last_name": "Pérez"
}


{
    "username": "usuario123",
    "password": "contraseñaSegura123"
}
