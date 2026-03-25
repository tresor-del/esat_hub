import pytest 
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.database import Base, engine
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_db


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
def get_test_db(db):
    try:
        yield db
    finally:
        db.close()

@pytest.fixture(scope="function")
def client(get_test_db):
    app.dependency_overrides[get_db] = get_test_db

    with TestClient(app) as c:
        yield c