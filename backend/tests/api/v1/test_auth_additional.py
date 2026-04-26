from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.schemas.user import User
from app.db.schemas.email_verification import EmailVerificationToken
from tests.utils import random_user_data, make_db_request


def test_resend_verification_email_succeeds(client: TestClient, db: Session):
    user_data = random_user_data().model_dump(mode="json")
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert r.status_code == 201

    r = client.post(
        f"{settings.API_V1_STR}/auth/resend-email",
        json={"email_in": str(user_data["email"])}
    )

    assert r.status_code == 200
    assert r.json()["message"] == "Si cet email est dans le système, un nouveau lien de vérification a été envoyé"


def test_check_profil_name_availability(client: TestClient, db: Session):
    user_data = random_user_data().model_dump(mode="json")
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert r.status_code == 201

    r = client.get(f"{settings.API_V1_STR}/auth/check-profil-name/{user_data['profil_name']}")
    assert r.status_code == 200
    assert r.json()["available"] is False
    assert "déjà utilisé" in r.json()["message"]


def test_check_profil_name_available_when_new(client: TestClient):
    r = client.get(f"{settings.API_V1_STR}/auth/check-profil-name/uniqueprofil123")

    assert r.status_code == 200
    assert r.json()["available"] is True
    assert r.json()["message"] == "Nom de profil disponible"
