import uuid

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from tests.utils import random_string


def test_get_current_user_profile(client: TestClient, test_user_with_password, access_token_for_test_user):
    user, _ = test_user_with_password
    headers = {"Authorization": f"Bearer {access_token_for_test_user}"}

    r = client.get(f"{settings.API_V1_STR}/users/me", headers=headers)

    assert r.status_code == 200
    data = r.json()
    assert data["id"] == str(user.id)
    assert data["email"] == user.email
    assert data["username"] == user.username


def test_update_current_user_profile(client: TestClient, test_user_with_password, access_token_for_test_user, db: Session):
    user, _ = test_user_with_password
    headers = {"Authorization": f"Bearer {access_token_for_test_user}"}
    update_payload = {
        "first_name": "UpdatedFirst",
        "last_name": "UpdatedLast",
        "domain": "AERONAUTIQUE"
    }

    r = client.put(f"{settings.API_V1_STR}/users/me", json=update_payload, headers=headers)

    assert r.status_code == 200
    data = r.json()
    assert data["first_name"] == "UpdatedFirst"
    assert data["last_name"] == "UpdatedLast"
    assert data["domain"] == "AERONAUTIQUE"

    db.add(user)
    db.refresh(user)
    assert user.first_name == "UpdatedFirst"
    assert user.last_name == "UpdatedLast"
    assert user.domain == "AERONAUTIQUE"


def test_get_user_profile_by_id(client: TestClient, test_user_with_password, access_token_for_test_user):
    user, _ = test_user_with_password
    headers = {"Authorization": f"Bearer {access_token_for_test_user}"}

    r = client.get(f"{settings.API_V1_STR}/users/{user.id}", headers=headers)

    assert r.status_code == 200
    data = r.json()
    assert data["id"] == str(user.id)
    assert data["email"] == user.email


def test_get_user_profile_not_found(client: TestClient, access_token_for_test_user):
    headers = {"Authorization": f"Bearer {access_token_for_test_user}"}
    random_uuid = str(uuid.uuid4())

    r = client.get(f"{settings.API_V1_STR}/users/{random_uuid}", headers=headers)

    assert r.status_code == 404
    assert r.json()["detail"] == "Utilisateur non trouvé"
