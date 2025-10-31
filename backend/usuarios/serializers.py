from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.password_validation import validate_password
from .models import Perfil, Permisos


class PerfilSerializer (serializers.ModelSerializer):

    class Meta:
        model = Perfil
        fields = ["aprobado"]


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


class ValidarAprobacion (TokenObtainPairSerializer):

    # Cuando llamamos a data = super().validate(attrs) esta hace una serie de comprobaciones
    # 1. Comprueba si el usuario y contraseña de attrs pertenece a un Usuario y de ser así devuelve el token
    # del usuario, como si ejecuta user = authenticate(username=username, password=password)
    # 2. Si se valida el usuario establece self.user = user

    def validate(self, attrs):

        data = super().validate(attrs)

        # Requiere aprobación para iniciar sesión
        if hasattr(self.user, 'perfil') and not self.user.perfil.aprobado:
            raise serializers.ValidationError({
                "detail": "Tu cuenta está pendiente de aprobación."
            })

        datos_usuario = UsuarioSerializer(self.user)
        data['user'] = datos_usuario.data

        return data


class RegistrarUsuario (serializers.ModelSerializer):
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

    class Meta:
        model = User
        fields = ['username', 'email', 'password',
                  'password2', 'first_name', 'last_name']
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False},
        }

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "El correo ya tiene una cuenta asociada")
        return value

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError(
                "Este nombre de usuario ya está en uso")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {"password": "Las contraseñas no coinciden"})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password2')

        user = User.objects.create_user(
            username=validated_data["username"],
            email=validated_data["email"],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )

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