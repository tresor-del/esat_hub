from fastapi.testclient import TestClient

from app.dependencies import get_auth_service
from app.main import app
from app.services.auth_service import AuthService
from tests.test_db import TestingSessionLocal

client = TestClient(app)

def override_get_auth_service():
    session = TestingSessionLocal()
    yield AuthService(session=session)

app.dependency_overrides[get_auth_service] = override_get_auth_service