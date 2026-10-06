import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
import io
import uuid

from app.core.config import settings
from app.db.schemas.user import User
from app.db.schemas.room import Room, RoomNames
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

    filtered_response = client.get(
        f"{settings.API_V1_STR}/posts/",
        params={"my_posts": True, "post_type": PostType.DOCUMENT.value},
        headers=auth_headers,
    )
    assert filtered_response.status_code == 200
    assert filtered_response.json()["total"] >= 1
    assert all(post["post_type"] == PostType.DOCUMENT.value for post in filtered_response.json()["posts"])


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


def test_get_post_not_found(client: TestClient, auth_headers: dict):
    response = client.get(
        f"{settings.API_V1_STR}/posts/{uuid.uuid4()}",
        headers=auth_headers,
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Post non trouvé"


def test_get_posts_room_and_all_visibility(
    client: TestClient,
    auth_headers: dict,
    test_user_with_password: tuple,
    db: Session,
):
    user, _ = test_user_with_password
    room = Room(name=RoomNames.INGE_1)
    db.add(room)
    db.flush()
    user.user_room_id = room.id
    db.commit()

    general_post = client.post(
        f"{settings.API_V1_STR}/posts/",
        data={"title": "General post", "post_type": PostType.DOCUMENT.value},
        headers=auth_headers,
    )
    private_post = client.post(
        f"{settings.API_V1_STR}/posts/",
        data={
            "title": "Room post",
            "post_type": PostType.DOCUMENT.value,
            "room_id": str(room.id),
        },
        headers=auth_headers,
    )
    assert general_post.status_code == 201
    assert private_post.status_code == 201

    default_list = client.get(f"{settings.API_V1_STR}/posts/", headers=auth_headers)
    all_list = client.get(
        f"{settings.API_V1_STR}/posts/",
        params={"all_posts": True},
        headers=auth_headers,
    )
    room_list = client.get(
        f"{settings.API_V1_STR}/posts/",
        params={"room_id": str(room.id)},
        headers=auth_headers,
    )

    assert default_list.status_code == all_list.status_code == room_list.status_code == 200
    assert [post["id"] for post in default_list.json()["posts"]] == [general_post.json()["id"]]
    assert {post["id"] for post in all_list.json()["posts"]} == {
        general_post.json()["id"],
        private_post.json()["id"],
    }
    assert [post["id"] for post in room_list.json()["posts"]] == [private_post.json()["id"]]


def test_create_post_for_another_room_forbidden(client: TestClient, auth_headers: dict):
    response = client.post(
        f"{settings.API_V1_STR}/posts/",
        data={
            "title": "Post in another room",
            "post_type": PostType.DOCUMENT.value,
            "room_id": str(uuid.uuid4()),
        },
        headers=auth_headers,
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Vous n'avez pas le droit de poster dans cette salle"


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


def test_update_and_delete_another_users_post_forbidden(
    client: TestClient,
    auth_headers: dict,
    admin_auth_headers: dict,
):
    create_response = client.post(
        f"{settings.API_V1_STR}/posts/",
        data={"title": "Owned post", "post_type": PostType.DOCUMENT.value},
        headers=auth_headers,
    )
    assert create_response.status_code == 201
    post_id = create_response.json()["id"]

    update_response = client.put(
        f"{settings.API_V1_STR}/posts/{post_id}",
        data={"title": "Unauthorized title"},
        headers=admin_auth_headers,
    )
    assert update_response.status_code == 403

    delete_response = client.delete(
        f"{settings.API_V1_STR}/posts/{post_id}",
        headers=admin_auth_headers,
    )
    assert delete_response.status_code == 403
    