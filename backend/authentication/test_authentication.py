import pytest
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient

from authentication.models import Permissions, Profile


@pytest.mark.django_db
def test_register_creates_profile_and_permissions():
    client = APIClient()
    payload = {
        "username": "newuser",
        "email": "newuser@example.com",
        "password": "StrongPass123!",
        "password2": "StrongPass123!",
        "first_name": "New",
        "last_name": "User",
    }

    response = client.post("/api/auth/register/", payload, format="json")
    assert response.status_code == 201

    user_model = get_user_model()
    user = user_model.objects.get(username="newuser")
    profile = Profile.objects.get(user=user)
    assert profile.permissions_id is not None


@pytest.mark.django_db
def test_login_rejects_unapproved_user():
    user_model = get_user_model()
    user = user_model.objects.create_user(
        username="pending",
        email="pending@example.com",
        password="StrongPass123!",
    )
    permissions = Permissions.objects.create()
    Profile.objects.create(user=user, permissions=permissions, aprobado=False)

    client = APIClient()
    response = client.post(
        "/api/auth/login/",
        {"username": "pending", "password": "StrongPass123!"},
        format="json",
    )
    assert response.status_code == 400


@pytest.mark.django_db
def test_login_returns_tokens_for_approved_user():
    user_model = get_user_model()
    user = user_model.objects.create_user(
        username="approved",
        email="approved@example.com",
        password="StrongPass123!",
    )
    permissions = Permissions.objects.create()
    Profile.objects.create(user=user, permissions=permissions, aprobado=True)

    client = APIClient()
    response = client.post(
        "/api/auth/login/",
        {"username": "approved", "password": "StrongPass123!"},
        format="json",
    )
    assert response.status_code == 200
    assert "access" in response.data
    assert "refresh" in response.data
    assert "user" in response.data


@pytest.mark.django_db
def test_superuser_can_update_permissions():
    user_model = get_user_model()
    admin = user_model.objects.create_superuser(
        username="admin",
        email="admin@example.com",
        password="StrongPass123!",
    )
    admin_permissions = Permissions.objects.create()
    Profile.objects.create(user=admin, permissions=admin_permissions, aprobado=True)

    target = user_model.objects.create_user(
        username="target",
        email="target@example.com",
        password="StrongPass123!",
    )
    target_permissions = Permissions.objects.create()
    Profile.objects.create(user=target, permissions=target_permissions, aprobado=True)

    client = APIClient()
    client.force_authenticate(user=admin)

    response = client.post(
        f"/api/users/{target.id}/permissions/",
        {"ViewReports": True},
        format="json",
    )
    assert response.status_code == 200
    target_permissions.refresh_from_db()
    assert target_permissions.ViewReports is True


@pytest.mark.django_db
def test_non_superuser_cannot_update_permissions():
    user_model = get_user_model()
    user = user_model.objects.create_user(
        username="basic",
        email="basic@example.com",
        password="StrongPass123!",
    )
    permissions = Permissions.objects.create()
    Profile.objects.create(user=user, permissions=permissions, aprobado=True)

    target = user_model.objects.create_user(
        username="target2",
        email="target2@example.com",
        password="StrongPass123!",
    )
    target_permissions = Permissions.objects.create()
    Profile.objects.create(user=target, permissions=target_permissions, aprobado=True)

    client = APIClient()
    client.force_authenticate(user=user)

    response = client.post(
        f"/api/users/{target.id}/permissions/",
        {"ViewReports": True},
        format="json",
    )
    assert response.status_code == 403
