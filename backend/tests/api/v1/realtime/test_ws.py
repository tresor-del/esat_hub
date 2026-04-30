import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.schemas.user import User
from app.db.security import create_access_token


def test_websocket_connection_success(client: TestClient, test_user_with_password: tuple):
    user, _ = test_user_with_password
    token = create_access_token(data={"sub": str(user.id)})

    with client.websocket_connect(f"{settings.API_V1_STR}/ws?token={token}") as websocket:
        # La connexion devrait réussir
        # Envoyer un message (bien que l'endpoint ne fasse rien avec)
        websocket.send_text("test message")
        # Fermer
        websocket.close()


def test_websocket_connection_invalid_token(client: TestClient):
    with pytest.raises(Exception):  # Ou spécifique à websocket
        with client.websocket_connect(f"{settings.API_V1_STR}/ws?token=invalid") as websocket:
            pass


def test_websocket_connection_no_token(client: TestClient):
    with pytest.raises(Exception):
        with client.websocket_connect(f"{settings.API_V1_STR}/ws") as websocket:
            pass