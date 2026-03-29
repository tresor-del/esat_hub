import datetime

from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.schemas.user import User
from app.db.schemas.email_verification import EmailVerificationToken
from app.core.config import settings
from tests.utils import random_user_data, make_db_request
from tests.utils import random_user_in_db


### Registration tests ###

def test_register_user_with_valid_data(client: TestClient, db: Session):
    user_data = random_user_data().model_dump(mode="json")
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    data = r.json()
    assert r.status_code == 201
    assert data["message"] == "Registration successful. Check your email."
    
    # vérifier que l'utilisateur a été créé dans la base de données avec is_verified à False
    user = make_db_request(db, User, field="email", value=user_data["email"])
    assert user is not None
    assert user.is_verified is False

    # vérifier que le token de vérification a été créé pour l'utilisateur
    token_record = make_db_request(db, EmailVerificationToken, field="user_id", value=user.id)
    assert token_record is not None

    # confirmation de l'email
    r = client.get(f"{settings.API_V1_STR}/auth/confirm-email?token={token_record.token}")
    assert r.status_code == 200
    data = r.json()
    assert data["message"] == "Email verified successfully"

    # vérifier que l'utilisateur a été créé dans la base de données avec is_verified à True
    user = make_db_request(db, User, field="email", value=user_data["email"])
    assert user is not None
    assert user.is_verified is True

    # vérifier que le token de vérification a été supprimé après validation
    token_record = make_db_request(db, EmailVerificationToken, field="user_id", value=user.id)
    assert token_record is None

def test_register_user_with_duplicate_email(client: TestClient, db: Session):
    user_data = random_user_data().model_dump(mode="json")
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert r.status_code == 201
    
    # essayer de s'inscrire à nouveau avec le même email
    user_data["profil_name"] = random_user_data().profil_name
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert r.status_code == 400
    data = r.json()                                                   
    assert data["detail"] == "Email already registered"

    # verifier que seul un utilisateur a été créé dans la base de données
    users = db.execute(select(User).where(User.email == user_data["email"])).scalars().all()
    assert len(users) == 1

def test_register_user_with_duplicate_profil_name(client: TestClient, db: Session):
    user_data = random_user_data().model_dump(mode="json")
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert r.status_code == 201
    
    # essayer de s'inscrire à nouveau avec le même profil name
    user_data["email"] = random_user_data().email
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    assert r.status_code == 400
    data = r.json()
    assert data["detail"] == "User with this profil name already exists"

    # verifier que seul un utilisateur a été créé dans la base de données
    users = db.execute(select(User).where(User.profil_name == user_data["profil_name"])).scalars().all()
    assert len(users) == 1

def test_confirm_email_with_invalid_token(client: TestClient):

    user_data = random_user_data().model_dump(mode="json")
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    data = r.json()
    assert r.status_code == 201
    assert data["message"] == "Registration successful. Check your email."
    
    # essayer de confirmer l'email avec un token invalide
    r = client.get(f"{settings.API_V1_STR}/auth/confirm-email?token=invalidtoken")
    assert r.status_code == 400
    data = r.json()
    assert data["detail"] == "Invalid token"

def test_confirm_email_with_expired_token(client: TestClient, db: Session):

    user_data = random_user_data().model_dump(mode="json")
    r = client.post(f"{settings.API_V1_STR}/auth/register", json=user_data)
    data = r.json()
    assert r.status_code == 201
    assert data["message"] == "Registration successful. Check your email."
    
    # récupérer le token de vérification créé pour l'utilisateur
    user = make_db_request(db, User, field="email", value=user_data["email"])
    token_record = make_db_request(db, EmailVerificationToken, field="user_id", value=user.id)
    
    # simuler l'expiration du token en modifiant sa date d'expiration dans la base de données
    token_record.expires_at = datetime.datetime.now() - datetime.timedelta(hours=1)
    db.add(token_record)
    db.commit()
    
    # essayer de confirmer l'email avec le token expiré
    r = client.get(f"{settings.API_V1_STR}/auth/confirm-email?token={token_record.token}")
    assert r.status_code == 400
    data = r.json()
    assert data["detail"] == "Token expired"

    # vérifier que l'utilisateur est supprimé de la base de données après l'expiration du token
    user = make_db_request(db, User, field="email", value=user_data["email"])
    assert user is None

### login tests ###

def test_login_user_with_valid_credentials(client: TestClient, test_user_with_password):
    test_user, password = test_user_with_password
    data = {
        "username": test_user.username,
        "password": password
    }
    r = client.post(f"{settings.API_V1_STR}/auth/token", data=data)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data, "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_login_user_with_invalid_password(client: TestClient, test_user_with_password):
    test_user, _ = test_user_with_password
    password = "fakepassword"
    data = {
        "username": test_user.username,
        "password": password
    }
    r = client.post(f"{settings.API_V1_STR}/auth/token", data=data)
    assert r.status_code == 401

def test_login_with_invalid_username(client: TestClient, test_user_with_password):
    _, password = test_user_with_password
    password = "fakepassword"
    data = {
        "username": "test_user.username",
        "password": password
    }
    r = client.post(f"{settings.API_V1_STR}/auth/token", data=data)
    assert r.status_code == 401

### refresh token tests ###

def test_refresh_token_success(client: TestClient, refresh_token_for_test_user):
    data = {"refresh_token": refresh_token_for_test_user}
    r = client.post(f"{settings.API_V1_STR}/auth/refresh", json=data)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"

def test_refresh_token_invalid(client: TestClient):
    data = {"refresh_token": "invalid_token"}
    r = client.post(f"{settings.API_V1_STR}/auth/refresh", json=data)
    assert r.status_code == 401
    data = r.json()
    assert data["detail"] == "Invalid refresh token"

def test_refresh_token_wrong_type(client: TestClient, access_token_for_test_user):
    data = {"refresh_token": access_token_for_test_user}
    r = client.post(f"{settings.API_V1_STR}/auth/refresh", json=data)
    assert r.status_code == 401
    data = r.json()
    assert data["detail"] == "Invalid refresh token"