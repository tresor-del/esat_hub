import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
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


def test_general_search_with_results(client: TestClient, auth_headers: dict, db: Session):
    """Test general search with matching results."""
    # First create a post with searchable content
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Unique Searchable Title 12345",
        "description": "This is a test description with searchable content",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 201

    # Search for the unique term
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "Unique Searchable Title 12345"},
        headers=auth_headers
    )

    assert r.status_code == 200
    result = r.json()
    assert result["posts_list"]["total"] == 1
    assert result["posts_list"]["posts"][0]["title"] == "Unique Searchable Title 12345"


def test_general_search_without_results(client: TestClient, auth_headers: dict, db: Session):
    """Test general search with no matching results."""
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "ThisDoesNotExistAnywhereInTheDatabase12345"},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert r.json()["posts_list"]["total"] == 0
    assert r.json()["posts_list"]["posts"] == []
    assert r.json()["users_list"]["total"] == 0
    assert r.json()["users_list"]["users"] == []


def test_general_search_with_pagination(client: TestClient, auth_headers: dict, db: Session):
    """Test general search with pagination parameters."""
    # First create some posts
    for i in range(3):
        file_content = f"test file content {i}".encode()
        files = {"file": (f"test{i}.txt", io.BytesIO(file_content), "text/plain")}
        data = {
            "title": f"Search Test Post {i}",
            "description": f"Test description {i}",
            "post_type": PostType.DOCUMENT.value,
        }

        r = client.post(
            f"{settings.API_V1_STR}/posts/",
            data=data,
            files=files,
            headers=auth_headers
        )
        assert r.status_code == 201

    # Search with pagination
    first_page = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "Search Test", "skip": 0, "limit": 2},
        headers=auth_headers
    )
    second_page = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "Search Test", "skip": 2, "limit": 2},
        headers=auth_headers
    )

    assert first_page.status_code == second_page.status_code == 200
    first_result = first_page.json()["posts_list"]
    second_result = second_page.json()["posts_list"]
    assert first_result["total"] == 2
    assert second_result["total"] == 1
    assert len(first_result["posts"]) == 2
    assert len(second_result["posts"]) == 1
    assert not {post["id"] for post in first_result["posts"]} & {
        post["id"] for post in second_result["posts"]
    }


def test_general_search_empty_query(client: TestClient, auth_headers: dict, db: Session):
    """Test general search with empty query."""
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": ""},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert r.json()["posts_list"]["posts"] == []
    assert r.json()["users_list"]["users"] == []


def test_general_search_special_characters(client: TestClient, auth_headers: dict, db: Session):
    """Test general search with special characters."""
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "@#$%^&*()"},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert r.json()["posts_list"]["posts"] == []


def test_general_search_unauthorized_without_token(client: TestClient):
    """Test that search requires authentication."""
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "test"}
    )

    assert r.status_code == 401  # Unauthorized


def test_general_search_partial_match(client: TestClient, auth_headers: dict, db: Session):
    """Test general search with partial term match."""
    # First create a post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Partial Match Test",
        "description": "Testing partial search functionality",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 201

    # Search with partial term
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "Partial"},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert any(post["title"] == "Partial Match Test" for post in r.json()["posts_list"]["posts"])


def test_general_search_case_insensitive(client: TestClient, auth_headers: dict, db: Session):
    """Test that search is case insensitive."""
    # First create a post
    file_content = b"test file content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    data = {
        "title": "Case Insensitive TEST",
        "description": "Testing case insensitive search",
        "post_type": PostType.DOCUMENT.value,
    }

    r = client.post(
        f"{settings.API_V1_STR}/posts/",
        data=data,
        files=files,
        headers=auth_headers
    )
    assert r.status_code == 201

    # Search with different case
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "case insensitive test"},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert any(post["title"] == "Case Insensitive TEST" for post in r.json()["posts_list"]["posts"])


def test_general_search_with_limit_parameter(client: TestClient, auth_headers: dict, db: Session):
    """Test search with explicit limit parameter."""
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "test", "limit": 5},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert len(r.json()["posts_list"]["posts"]) <= 5


def test_general_search_with_skip_parameter(client: TestClient, auth_headers: dict, db: Session):
    """Test search with explicit skip parameter for pagination."""
    r = client.get(
        f"{settings.API_V1_STR}/search/general",
        params={"q": "test", "skip": 10},
        headers=auth_headers
    )

    assert r.status_code == 200
    assert r.json()["posts_list"]["total"] <= len(r.json()["posts_list"]["posts"]) + 10