import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import io
from PIL import Image

from app.core.config import settings
from app.db.schemas.user import User
from app.models.post import PostType


def test_download_post_file_success(client: TestClient, auth_headers: dict, db: Session):
    # Créer un post avec fichier
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
    post_data = r.json()
    post_id = post_data["id"]

    # Télécharger le fichier
    r = client.get(
        f"{settings.API_V1_STR}/files/posts/{post_id}",
        headers=auth_headers
    )

    assert r.status_code == 200
    assert r.content == file_content


def _make_test_image_bytes() -> bytes:
    buffer = io.BytesIO()
    image = Image.new("RGB", (10, 10), color="white")
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_upload_avatar_success(client: TestClient, auth_headers: dict, db: Session):
    # Simuler un fichier image valide
    image_content = _make_test_image_bytes()
    files = {"avatar": ("avatar.jpg", io.BytesIO(image_content), "image/jpeg")}

    r = client.post(
        f"{settings.API_V1_STR}/files/users/me/avatar",
        files=files,
        headers=auth_headers
    )

    assert r.status_code == 200
    response_data = r.json()
    assert "message" in response_data
    assert "avatar_path" in response_data


def test_get_avatar_success(client: TestClient, auth_headers: dict, db: Session, test_user_with_password: tuple):
    user, _ = test_user_with_password
    user_id = user.id

    # D'abord uploader un avatar
    image_content = _make_test_image_bytes()
    files = {"avatar": ("avatar.jpg", io.BytesIO(image_content), "image/jpeg")}

    r = client.post(
        f"{settings.API_V1_STR}/files/users/me/avatar",
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 200

    # Maintenant récupérer l'avatar
    r = client.get(
        f"{settings.API_V1_STR}/files/users/{user_id}/avatar"
    )

    assert r.status_code == 200
    # Just verify we get some image content back (may be resized)
    assert r.content.startswith(b'\xff\xd8')