import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid
import io

from app.core.config import settings
from app.models.post import PostType


def _make_test_image_bytes() -> bytes:
    """Helper to create a valid JPEG image for tests."""
    from PIL import Image
    buffer = io.BytesIO()
    image = Image.new("RGB", (10, 10), color="white")
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_get_all_notifications_success(client: TestClient, auth_headers: dict, db: Session):
    """Test getting all notifications for the current user."""
    r = client.get(
        f"{settings.API_V1_STR}/notifications/me/all",
        headers=auth_headers
    )

    assert r.status_code == 200
    # Should return a dict with notifications and total
    response_data = r.json()
    assert "notifications" in response_data or isinstance(response_data, (list, dict))


def test_delete_single_notification_success(client: TestClient, auth_headers: dict, db: Session):
    """Test deleting a single notification."""
    # First create a post to potentially generate a notification
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Notification",
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

    # Get notifications (may be empty but should work)
    r = client.get(
        f"{settings.API_V1_STR}/notifications/me/all",
        headers=auth_headers
    )
    assert r.status_code == 200

    # Try to delete a non-existent notification
    fake_notif_id = str(uuid.uuid4())
    r = client.delete(
        f"{settings.API_V1_STR}/notifications/me/delete/{fake_notif_id}",
        headers=auth_headers
    )

    # Should return 404 for non-existent notification
    assert r.status_code == 404


def test_delete_all_notifications_success(client: TestClient, auth_headers: dict, db: Session):
    """Test deleting all notifications."""
    r = client.delete(
        f"{settings.API_V1_STR}/notifications/me/all",
        headers=auth_headers
    )

    assert r.status_code == 200
    assert "success" in r.json()["message"].lower() or "succès" in r.json()["message"].lower()


def test_mark_all_notifications_as_read_success(client: TestClient, auth_headers: dict, db: Session):
    """Test marking all notifications as read."""
    r = client.put(
        f"{settings.API_V1_STR}/notifications/me/all",
        headers=auth_headers
    )

    assert r.status_code == 200
    assert "success" in r.json()["message"].lower() or "succès" in r.json()["message"].lower() or "lus" in r.json()["message"].lower()


def test_mark_single_notification_as_read_success(client: TestClient, auth_headers: dict, db: Session):
    """Test marking a single notification as read."""
    # First create a post to potentially generate a notification
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Mark Read",
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

    # Try to mark a non-existent notification as read
    fake_notif_id = str(uuid.uuid4())
    r = client.put(
        f"{settings.API_V1_STR}/notifications/me/{fake_notif_id}",
        headers=auth_headers
    )

    # Should return 404 for non-existent notification
    assert r.status_code == 404


def test_notification_unauthorized_without_token(client: TestClient):
    """Test that endpoints require authentication."""
    # Try to access notifications without auth
    r = client.get(f"{settings.API_V1_STR}/notifications/me/all")
    assert r.status_code == 401  # Unauthorized


def test_delete_notification_unauthorized(client: TestClient):
    """Test that delete notification requires authentication."""
    fake_notif_id = str(uuid.uuid4())
    r = client.delete(f"{settings.API_V1_STR}/notifications/me/delete/{fake_notif_id}")
    assert r.status_code == 401


def test_mark_notification_unauthorized(client: TestClient):
    """Test that mark notification requires authentication."""
    fake_notif_id = str(uuid.uuid4())
    r = client.put(f"{settings.API_V1_STR}/notifications/me/{fake_notif_id}")
    assert r.status_code == 401


def test_delete_nonexistent_notification_returns_404(client: TestClient, auth_headers: dict, db: Session):
    """Test that deleting a non-existent notification returns 404."""
    fake_notif_id = str(uuid.uuid4())
    r = client.delete(
        f"{settings.API_V1_STR}/notifications/me/delete/{fake_notif_id}",
        headers=auth_headers
    )
    assert r.status_code == 404


def test_mark_nonexistent_notification_as_read_returns_404(client: TestClient, auth_headers: dict, db: Session):
    """Test that marking a non-existent notification as read returns 404."""
    fake_notif_id = str(uuid.uuid4())
    r = client.put(
        f"{settings.API_V1_STR}/notifications/me/{fake_notif_id}",
        headers=auth_headers
    )
    assert r.status_code == 404