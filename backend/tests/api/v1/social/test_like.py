import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.post import PostType


def test_toggle_post_like_success(client: TestClient, auth_headers: dict, db: Session):
    files = {"file": ("test.txt", b"test file content", "text/plain")}
    data = {
        "title": "Test Post",
        "description": "Test description",
        "post_type": PostType.DOCUMENT.value,
    }

    create_response = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers,
    )

    assert create_response.status_code == 201
    post_id = create_response.json()["id"]

    like_response = client.post(
        f"{settings.API_V1_STR}/posts/{post_id}/like",
        headers=auth_headers,
    )

    assert like_response.status_code == 200
    like_payload = like_response.json()
    assert like_payload["post_id"] == post_id
    assert like_payload["liked_by_me"] is True
    assert like_payload["likes_count"] == 1

    second_like_response = client.post(
        f"{settings.API_V1_STR}/posts/{post_id}/like",
        headers=auth_headers,
    )

    assert second_like_response.status_code == 200
    assert second_like_response.json()["liked_by_me"] is False
    assert second_like_response.json()["likes_count"] == 0
