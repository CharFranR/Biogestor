from django.contrib.auth import get_user_model
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Permissions, Profile
from .permissions import AllowApproveUsers
from .serializers import (
    ApprovalValidationSerializer,
    PermissionsSerializer,
    UserRegistrationSerializer,
    UserSerializer,
)

User = get_user_model()


def _ensure_profile(user: User) -> Profile:
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        permissions = Permissions.objects.create()
        profile = Profile.objects.create(user=user, permissions=permissions)
        return profile

    if profile.permissions_id is None:
        profile.permissions = Permissions.objects.create()
        profile.save(update_fields=["permissions"])
    return profile


class AuthViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        serializer = UserRegistrationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _ensure_profile(user)
        return Response(
            {
                "message": "User registered successfully. Await admin approval.",
                "user": UserSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=False, methods=["post"], url_path="login")
    def login(self, request):
        serializer = ApprovalValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="refresh")
    def refresh(self, request):
        serializer = TokenRefreshSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    @action(
        detail=False,
        methods=["post"],
        url_path="logout",
        permission_classes=[IsAuthenticated],
    )
    def logout(self, request):
        refresh_token = request.data.get("refresh_token")
        if not refresh_token:
            return Response(
                {"error": "refresh_token is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"error": "Invalid refresh token."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"message": "Logged out successfully."},
            status=status.HTTP_200_OK,
        )


class UserViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in {"list", "pending", "approve", "permissions", "set_role"}:
            permission_classes = [IsAuthenticated, AllowApproveUsers]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]

    def list(self, request):
        users = User.objects.filter(profile__aprobado=True)
        serializer = UserSerializer(users, many=True)
        return Response({"total": users.count(), "users": serializer.data})

    @action(detail=False, methods=["get"], url_path="pending")
    def pending(self, request):
        users = User.objects.filter(profile__aprobado=False)
        serializer = UserSerializer(users, many=True)
        return Response({"total_pending": users.count(), "users": serializer.data})

    @action(detail=False, methods=["get"], url_path="me")
    def me(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        profile = _ensure_profile(user)
        profile.aprobado = True
        profile.save(update_fields=["aprobado"])
        return Response(
            {
                "message": f"User {user.username} approved.",
                "user": UserSerializer(user).data,
            }
        )

    @action(detail=True, methods=["get", "post"], url_path="permissions")
    def permissions(self, request, pk=None):
        user = get_object_or_404(User, pk=pk)
        profile = _ensure_profile(user)
        permissions = profile.permissions

        if request.method == "GET":
            serializer = PermissionsSerializer(permissions)
            return Response(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "permissions": serializer.data,
                }
            )

        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can modify permissions."},
                status=status.HTTP_403_FORBIDDEN,
            )

        for field, value in request.data.items():
            if hasattr(permissions, field):
                setattr(permissions, field, value)

        permissions.save()
        serializer = PermissionsSerializer(permissions)
        return Response(
            {
                "user_id": user.id,
                "username": user.username,
                "permissions": serializer.data,
            }
        )

    @action(detail=True, methods=["post"], url_path="role")
    def set_role(self, request, pk=None):
        role = str(request.data.get("role") or request.data.get("rol") or "").upper()
        if role not in ("ADMIN", "COLAB", "VISIT"):
            return Response(
                {"error": "Invalid role."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can change roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = get_object_or_404(User, pk=pk)
        profile = _ensure_profile(user)
        permissions = profile.permissions

        if role == "ADMIN":
            permissions.ApproveUsers = True
            permissions.ViewReports = True
            permissions.GenerateReports = True
            permissions.ViewDashboard = True
            permissions.ViewFillData = True
            permissions.ViewCalibrations = True
            permissions.ViewInventory = True
            permissions.ModifyInventory = True
        elif role == "COLAB":
            permissions.ApproveUsers = False
            permissions.ViewReports = True
            permissions.GenerateReports = False
            permissions.ViewDashboard = True
            permissions.ViewFillData = True
            permissions.ViewCalibrations = True
            permissions.ViewInventory = False
            permissions.ModifyInventory = False
        else:
            permissions.ApproveUsers = False
            permissions.ViewReports = False
            permissions.GenerateReports = False
            permissions.ViewDashboard = False
            permissions.ViewFillData = False
            permissions.ViewCalibrations = False
            permissions.ViewInventory = False
            permissions.ModifyInventory = False

        permissions.save()
        profile.rol = role
        profile.save(update_fields=["rol"])

        return Response(
            {
                "user_id": user.id,
                "role": profile.rol,
                "permissions": PermissionsSerializer(permissions).data,
                "user": UserSerializer(user).data,
            }
        )
