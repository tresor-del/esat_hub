import pytest 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.db.schemas.user import User
from tests.utils import random_user_in_db
from app.db.database import Base, engine
from app.main import app
from app.dependencies import get_db
from app.db.security import create_access_token, create_refresh_token
from app.dependencies import get_auth_service


# Base de donnée sqlite en memmoire pour les tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

connect_args = {"check_same_thread": False}  # permet a plusieurs threads d'accéder à la même base de données en mémoire

# moteur sqlalchemy qui permet de se connecter à la base de donnée
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

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
        try:
            yield db
        finally:
            db.close()

    # override de la dépendance get_db pour utiliser la session de test au lieu de la session de production
    app.dependency_overrides[get_db] = get_test_db

    with TestClient(app) as c:
        yield c

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
def auth_headers(test_user):
    access_token = create_access_token(data={"sub": str(test_user.id)})
    return {"Authorization": f"Bearer {access_token}"}

@pytest.fixture(scope="function")
def refresh_token_for_test_user(test_user_with_password):
    return create_refresh_token(data={"sub": str(test_user_with_password[0].id)})

@pytest.fixture(scope="function")
def access_token_for_test_user(test_user_with_password):
    return create_access_token(data={"sub": str(test_user_with_password[0].id)})