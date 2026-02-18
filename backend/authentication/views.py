from django.contrib.auth import get_user_model
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

# ============================================================================
# Permission field names for role assignment
# ============================================================================
ALL_PERMISSION_FIELDS = [
    "ViewDashboard",
    "ViewFillData",
    "CreateFill",
    "EndFill",
    "ViewCalibrations",
    "CreateCalibrations",
    "ModifyCalibrations",
    "UpdateCalibrations",
    "DeleteCalibrations",
    "ViewInventory",
    "CreateInventory",
    "ModifyInventory",
    "UpdateInventory",
    "DeleteInventory",
    "ViewCalculator",
    "ViewReports",
    "GenerateReports",
    "ViewUsers",
    "ModifyUsers",
    "ApproveUsers",
    "BanUsers",
]

ROLE_PERMISSIONS = {
    "ADMIN": {field: True for field in ALL_PERMISSION_FIELDS},
    "COLAB": {
        "ViewDashboard": True,
        "ViewFillData": True,
        "CreateFill": True,
        "EndFill": True,
        "ViewCalibrations": True,
        "CreateCalibrations": True,
        "ModifyCalibrations": False,
        "UpdateCalibrations": False,
        "DeleteCalibrations": False,
        "ViewInventory": True,
        "CreateInventory": False,
        "ModifyInventory": False,
        "UpdateInventory": False,
        "DeleteInventory": False,
        "ViewCalculator": True,
        "ViewReports": True,
        "GenerateReports": False,
        "ViewUsers": False,
        "ModifyUsers": False,
        "ApproveUsers": False,
        "BanUsers": False,
    },
    "VISIT": {field: False for field in ALL_PERMISSION_FIELDS},
}


def _apply_role_permissions(permissions: Permissions, role: str) -> None:
    """Apply permission values based on role."""
    role_perms = ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["VISIT"])
    for field, value in role_perms.items():
        setattr(permissions, field, value)
    permissions.save()


def _ensure_profile(user: User) -> Profile:
    """Ensure user has a profile and permissions. Superusers get all permissions."""
    try:
        profile = user.profile
    except Profile.DoesNotExist:
        permissions = Permissions.objects.create()
        profile = Profile.objects.create(user=user, permissions=permissions)

    if profile.permissions_id is None:
        profile.permissions = Permissions.objects.create()
        profile.save(update_fields=["permissions"])

    # Superusers (Django admins) get all permissions automatically
    if user.is_superuser:
        _apply_role_permissions(profile.permissions, "ADMIN")
        if not profile.aprobado or profile.rol != "ADMIN":
            profile.aprobado = True
            profile.rol = "ADMIN"
            profile.save(update_fields=["aprobado", "rol"])

    return profile


# ============================================================================
# AuthViewSet - Authentication endpoints (no model, uses ViewSet)
# ============================================================================
class AuthViewSet(viewsets.ViewSet):
    """
    ViewSet for authentication operations.
    No model backing - handles register, login, refresh, logout.
    """

    permission_classes = [AllowAny]

    @action(detail=False, methods=["post"], url_path="register")
    def register(self, request):
        """Register a new user (pending approval)."""
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
        """Login and return JWT tokens."""
        serializer = ApprovalValidationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="refresh")
    def refresh(self, request):
        """Refresh access token using refresh token."""
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
        """Logout by blacklisting the refresh token."""
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

        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    """
    ModelViewSet for User management.
    Provides list, retrieve, and custom actions for user administration.
    """

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "post", "head", "options"]  

    def get_permissions(self):
        """Admin-only actions require AllowApproveUsers permission."""
        admin_actions = {"list", "retrieve", "pending", "approve", "permissions", "set_role"}
        if self.action in admin_actions:
            return [IsAuthenticated(), AllowApproveUsers()]
        return [IsAuthenticated()]

    def get_queryset(self):
        """Filter queryset based on action."""
        if self.action == "list":
            return User.objects.filter(profile__aprobado=True)
        return User.objects.all()

    def list(self, request, *args, **kwargs):
        """List all approved users."""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response({"total": queryset.count(), "users": serializer.data})

    @action(detail=False, methods=["get"], url_path="pending")
    def pending(self, request):
        """List all users pending approval."""
        users = User.objects.filter(profile__aprobado=False)
        serializer = self.get_serializer(users, many=True)
        return Response({"total_pending": users.count(), "users": serializer.data})

    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get the current authenticated user's data."""
        _ensure_profile(request.user)
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        """Approve a pending user."""
        user = self.get_object()
        profile = _ensure_profile(user)
        profile.aprobado = True
        profile.save(update_fields=["aprobado"])
        return Response(
            {
                "message": f"User {user.username} approved.",
                "user": self.get_serializer(user).data,
            }
        )

    @action(detail=True, methods=["get", "post"], url_path="permissions")
    def permissions(self, request, pk=None):
        """Get or update user permissions."""
        user = self.get_object()
        profile = _ensure_profile(user)
        permissions = profile.permissions

        if request.method == "GET":
            return Response(
                {
                    "user_id": user.id,
                    "username": user.username,
                    "permissions": PermissionsSerializer(permissions).data,
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
        return Response(
            {
                "user_id": user.id,
                "username": user.username,
                "permissions": PermissionsSerializer(permissions).data,
            }
        )

    @action(detail=True, methods=["post"], url_path="role")
    def set_role(self, request, pk=None):
        """Set user role and apply corresponding permissions."""
        role = str(request.data.get("role") or request.data.get("rol") or "").upper()
        if role not in ROLE_PERMISSIONS:
            return Response(
                {"error": "Invalid role. Must be ADMIN, COLAB, or VISIT."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can change roles."},
                status=status.HTTP_403_FORBIDDEN,
            )

        user = self.get_object()
        profile = _ensure_profile(user)

        _apply_role_permissions(profile.permissions, role)
        profile.rol = role
        profile.save(update_fields=["rol"])

        return Response(
            {
                "user_id": user.id,
                "role": profile.rol,
                "permissions": PermissionsSerializer(profile.permissions).data,
                "user": self.get_serializer(user).data,
            }
        )