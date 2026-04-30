import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import io

from app.core.config import settings
from app.db.schemas.user import User
from app.models.post import PostType


def test_create_post_success(client: TestClient, auth_headers: dict, db: Session):
    # Simuler un fichier upload
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post",
        "description": "Test description",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )

    assert r.status_code == 201
    response_data = r.json()
    assert response_data["title"] == "Test Post"
    assert response_data["description"] == "Test description"
    assert response_data["post_type"] == PostType.DOCUMENT.value


def test_get_posts_success(client: TestClient, auth_headers: dict, db: Session):
    # D'abord créer un post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post",
        "description": "Test description",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 201

    # Maintenant récupérer les posts
    r = client.get(
        f"{settings.API_V1_STR}/posts/",
        headers=auth_headers
    )

    assert r.status_code == 200
    response_data = r.json()
    assert response_data["total"] >= 1
    assert len(response_data["posts"]) >= 1


def test_get_post_by_id_success(client: TestClient, auth_headers: dict, db: Session):
    # Créer un post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post",
        "description": "Test description",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 201
    post_id = r.json()["id"]

    # Récupérer le post par ID
    r = client.get(
        f"{settings.API_V1_STR}/posts/{post_id}",
        headers=auth_headers
    )

    assert r.status_code == 200
    response_data = r.json()
    assert response_data["id"] == post_id
    assert response_data["title"] == "Test Post"


def test_update_post_success(client: TestClient, auth_headers: dict, db: Session):
    # Créer un post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post",
        "description": "Test description",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 201
    post_id = r.json()["id"]

    # Mettre à jour le post
    new_data = {
        "title": "Updated Title",
        "description": "Updated description",
    }

    r = client.put(
        f"{settings.API_V1_STR}/posts/{post_id}",
        data=new_data,
        headers=auth_headers
    )

    assert r.status_code == 200
    response_data = r.json()
    assert response_data["title"] == "Updated Title"
    assert response_data["description"] == "Updated description"


def test_delete_post_success(client: TestClient, auth_headers: dict, db: Session):
    # Créer un post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post",
        "description": "Test description",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 201
    post_id = r.json()["id"]

    # Supprimer le post
    r = client.delete(
        f"{settings.API_V1_STR}/posts/{post_id}",
        headers=auth_headers
    )

    assert r.status_code == 204

    # Vérifier que le post n'existe plus
    r = client.get(
        f"{settings.API_V1_STR}/posts/{post_id}",
        headers=auth_headers
    )

    assert r.status_code == 404