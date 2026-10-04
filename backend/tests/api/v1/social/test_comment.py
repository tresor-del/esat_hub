import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import uuid
import io

from app.core.config import settings
from app.models.post import PostType
from app.models.comment import CommentCreate
from app.db.schemas.post import Post
from tests.utils import make_db_request


def _make_test_image_bytes() -> bytes:
    """Helper to create a valid JPEG image for tests."""
    from PIL import Image
    buffer = io.BytesIO()
    image = Image.new("RGB", (10, 10), color="white")
    image.save(buffer, format="JPEG")
    return buffer.getvalue()


def test_create_comment_success(client: TestClient, auth_headers: dict, db: Session):
    """Test creating a comment on a post."""
    # First create a post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Comment",
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

    # Create a comment (user_id is set automatically from current_user)
    comment_data = {
        "content": "This is a test comment",
        "post_id": post_id
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=comment_data,
        headers=auth_headers
    )

    assert r.status_code == 201
    response_data = r.json()
    assert response_data["content"] == "This is a test comment"
    assert response_data["post_id"] == post_id


def test_create_comment_on_nonexistent_post(client: TestClient, auth_headers: dict, db: Session):
    """Test creating a comment on a non-existent post."""
    comment_data = {
        "content": "This is a test comment",
        "post_id": str(uuid.uuid4()),
        "parent_id": None
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=comment_data,
        headers=auth_headers
    )

    assert r.status_code == 404


def test_create_reply_comment(client: TestClient, auth_headers: dict, db: Session):
    """Test creating a reply to an existing comment."""
    # First create a post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Reply",
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

    # Create parent comment
    comment_data = {
        "content": "Parent comment",
        "post_id": post_id
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=comment_data,
        headers=auth_headers
    )
    assert r.status_code == 201
    parent_comment_id = r.json()["id"]

    # Create reply
    reply_data = {
        "content": "Reply comment",
        "post_id": post_id,
        "parent_id": parent_comment_id
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=reply_data,
        headers=auth_headers
    )

    assert r.status_code == 201
    response_data = r.json()
    assert response_data["content"] == "Reply comment"
    assert response_data["parent_id"] == parent_comment_id


def test_get_comment_success(client: TestClient, auth_headers: dict, db: Session):
    """Test getting a specific comment."""
    # First create a post and comment
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Get",
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

    comment_data = {
        "content": "Comment to get",
        "post_id": post_id
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=comment_data,
        headers=auth_headers
    )
    assert r.status_code == 201
    comment_id = r.json()["id"]

    # Get the comment
    r = client.get(
        f"{settings.API_V1_STR}/comments/{comment_id}",
        headers=auth_headers
    )

    assert r.status_code == 200
    assert r.json()["id"] == comment_id
    assert r.json()["content"] == "Comment to get"
    assert r.json()["post_id"] == post_id


def test_get_nonexistent_comment(client: TestClient, auth_headers: dict, db: Session):
    """Test getting a non-existent comment."""
    fake_comment_id = str(uuid.uuid4())
    r = client.get(
        f"{settings.API_V1_STR}/comments/{fake_comment_id}",
        headers=auth_headers
    )

    assert r.status_code == 404


def test_update_own_comment_success(client: TestClient, auth_headers: dict, db: Session):
    """Test updating one's own comment."""
    # First create a post and comment
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Update",
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

    comment_data = {
        "content": "Original content",
        "post_id": post_id
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=comment_data,
        headers=auth_headers
    )
    assert r.status_code == 201
    comment_id = r.json()["id"]

    # Update the comment
    r = client.put(
        f"{settings.API_V1_STR}/comments/update/{comment_id}",
        params={"new_content": "Updated content"},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert r.json()["content"] == "Updated content"


def test_update_another_user_comment_forbidden(
    client: TestClient,
    auth_headers: dict,
    admin_auth_headers: dict,
):
    """Test that a user cannot update another user's comment."""
    # First create a post and comment
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Forbidden Update",
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

    comment_data = {
        "content": "Comment to update",
        "post_id": post_id
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=comment_data,
        headers=auth_headers
    )
    assert r.status_code == 201
    comment_id = r.json()["id"]

    response = client.put(
        f"{settings.API_V1_STR}/comments/update/{comment_id}",
        params={"new_content": "Unauthorized update"},
        headers=admin_auth_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Not allowed"


def test_delete_own_comment_success(client: TestClient, auth_headers: dict, db: Session):
    """Test deleting one's own comment."""
    # First create a post and comment
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Delete",
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

    comment_data = {
        "content": "Comment to delete",
        "post_id": post_id
    }

    r = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json=comment_data,
        headers=auth_headers
    )
    assert r.status_code == 201
    comment_id = r.json()["id"]

    # Delete the comment
    r = client.delete(
        f"{settings.API_V1_STR}/comments/delete/{comment_id}",
        headers=auth_headers
    )

    assert r.status_code == 200
    assert "deleted" in r.json()["message"].lower()


def test_get_post_comments(client: TestClient, auth_headers: dict, db: Session):
    """Test getting all comments for a post."""
    # First create a post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Test Post for Comments List",
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

    # Create multiple comments
    for i in range(3):
        comment_data = {
            "content": f"Comment {i+1}",
            "post_id": post_id
        }

        r = client.post(
            f"{settings.API_V1_STR}/comments/create",
            json=comment_data,
            headers=auth_headers
        )
        assert r.status_code == 201

    # Get all comments for the post
    r = client.get(
        f"{settings.API_V1_STR}/comments/posts/{post_id}/comments?limit=2",
        headers=auth_headers
    )

    assert r.status_code == 200
    response_data = r.json()
    assert response_data["total"] == 3
    assert len(response_data["comments"]) == 2

    next_page = client.get(
        f"{settings.API_V1_STR}/comments/posts/{post_id}/comments?skip=2&limit=2",
        headers=auth_headers,
    )
    assert next_page.status_code == 200
    assert next_page.json()["total"] == 3
    assert len(next_page.json()["comments"]) == 1


def test_get_comments_for_nonexistent_post(client: TestClient, auth_headers: dict, db: Session):
    """Test getting comments for a non-existent post."""
    r = client.get(
        f"{settings.API_V1_STR}/comments/posts/{uuid.uuid4()}/comments",
        headers=auth_headers
    )

    assert r.status_code == 404
    assert r.json()["detail"] == "Post not found"


def test_delete_another_users_comment_forbidden(
    client: TestClient,
    auth_headers: dict,
    admin_auth_headers: dict,
):
    post_response = client.post(
        f"{settings.API_V1_STR}/posts/",
        data={"title": "Comment ownership", "post_type": PostType.DOCUMENT.value},
        headers=auth_headers,
    )
    assert post_response.status_code == 201

    comment_response = client.post(
        f"{settings.API_V1_STR}/comments/create",
        json={"content": "Owned comment", "post_id": post_response.json()["id"]},
        headers=auth_headers,
    )
    assert comment_response.status_code == 201

    response = client.delete(
        f"{settings.API_V1_STR}/comments/delete/{comment_response.json()['id']}",
        headers=admin_auth_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Not allowed"


def test_delete_nonexistent_comment_returns_not_found(client: TestClient, auth_headers: dict):
    response = client.delete(
        f"{settings.API_V1_STR}/comments/delete/{uuid.uuid4()}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Comment not found"
