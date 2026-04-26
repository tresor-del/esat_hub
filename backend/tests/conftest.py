import os
# Set required environment variables before importing app modules
os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing")
os.environ.setdefault("REFRESH_SECRET_KEY", "test-refresh-secret-key-for-testing")
os.environ.setdefault("SQLALCHEMY_DATABASE_URI", "sqlite:///:memory:")
os.environ.setdefault("SMTP_HOST", "test-smtp-host")
os.environ.setdefault("SMTP_PORT", "587")
os.environ.setdefault("SMTP_USER", "test-smtp-user")
os.environ.setdefault("SMTP_PASSWORD", "test-smtp-password")
os.environ.setdefault("EMAILS_FROM_EMAIL", "test@example.com")
os.environ.setdefault("EMAILS_FROM_NAME", "Test App")
os.environ.setdefault("SUPER_ADMIN_BIRTHDAY", "2000-01-01")

import pytest 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.db.schemas.user import User, UserRole, UserStatus
from tests.utils import random_user_in_db
from app.db.database import Base, engine
from app.main import app
from app.api.deps.db import get_db
from app.db.security import create_access_token, create_refresh_token
from app.api.deps.services import get_auth_service


# Base de donnée sqlite en memmoire pour les tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

connect_args = {"check_same_thread": False}  # permet a plusieurs threads d'accéder à la même base de données en mémoire

# moteur sqlalchemy qui permet de se connecter à la base de donnée
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args, poolclass=StaticPool)

# crées mes tables dans la base de données pour les tests
Base.metadata.create_all(bind=engine)

# permet de créer des sessions de base de données pour les requêtes
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session")
def setup_database():
    # setup de la base de données avant les tests
    Base.metadata.create_all(bind=engine)
    yield
    # teardown de la base de données après les tests
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db(setup_database):
    connection = engine.connect()
    # transaction permet de ne pas commiter les changements dans la base de données pendant les tests, 
    # et de rollback après chaque test pour repartir d'une base propre
    transaction = connection.begin()
    # les sessions seront liées à cette connexion et transaction, ce qui permet de faire des tests isolés sans affecter la base de données
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()

@pytest.fixture(scope="function")
def client(db):

    def get_test_db():
        yield db

    # override de la dépendance get_db pour utiliser la session de test au lieu de la session de production
    app.dependency_overrides[get_db] = get_test_db

    with TestClient(app) as c:
        yield c

# Random user

@pytest.fixture(scope="function")
def test_user_with_password(db):
    user_data, password = random_user_in_db()
    user_dict = user_data.model_dump()
    auth_service = get_auth_service(db)
    username = auth_service.get_username(user_dict["profil_name"], user_dict["school_name"])
    user_dict["username"] = username
    test_user = User(**user_dict)
    db.add(test_user)
    db.commit()
    db.refresh(test_user)
    return test_user, password

@pytest.fixture(scope="function")
def auth_headers(test_user_with_password):
    test_user, _ = test_user_with_password
    access_token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture(scope="function")
def refresh_token_for_test_user(test_user_with_password):
    return create_refresh_token(data={"sub": str(test_user_with_password[0].id)})

@pytest.fixture(scope="function")
def access_token_for_test_user(test_user_with_password):
    return create_access_token(data={"sub": str(test_user_with_password[0].id)})

# Admin user

@pytest.fixture(scope="function")
def admin(db):
    admin_data, _ = random_user_in_db()
    admin_data.role = UserRole.ADMIN
    admin_data.status = UserStatus.ACTIVE
    admin = User(**admin_data.model_dump())
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin

@pytest.fixture(scope="function")
def admin_auth_headers(admin):
    access_token = create_access_token(data={"sub": str(admin.id)})
    return {"Authorization": f"Bearer {access_token}"}