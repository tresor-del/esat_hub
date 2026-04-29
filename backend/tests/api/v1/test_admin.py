import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.db.schemas.user import User, UserRole, UserStatus
from app.db.schemas.post import Post, PostStatus, PostType
from app.db.schemas.comments import Comment
from tests.utils import random_user_in_db


class TestAdminUserEndpoints:
    """Test admin user management endpoints."""

    def test_get_all_users_as_admin(self, client, db, admin_auth_headers, admin):
        """Test getting all users as admin."""

        
        # Create regular user
        user_data, _ = random_user_in_db()
        user = User(**user_data.model_dump())
        db.add(user)
        db.commit()
        
        # Get token for admin

        response = client.get("/api/v1/admin/users", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "users" in data

    def test_get_all_users_as_non_admin(self, client, db,auth_headers, ):
        """Test that non-admin users cannot access admin endpoints."""
        
        response = client.get("/api/v1/admin/users", headers=auth_headers)
        
        assert response.status_code == 403

    def test_get_user_by_id(self, client, db, admin_auth_headers, admin):
        """Test getting a specific user by ID."""

        
        # Create regular user
        user_data, _ = random_user_in_db()
        user = User(**user_data.model_dump())
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Get token for admin

        response = client.get(f"/api/v1/admin/users/{user.id}", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user.id)

    def test_get_user_by_id_not_found(self, client, db, admin_auth_headers, admin):
        """Test getting a non-existent user."""

        
        # Get token for admin

        fake_id = uuid4()
        response = client.get(f"/api/v1/admin/users/{fake_id}", headers=admin_auth_headers)
        
        assert response.status_code == 404

    def test_update_user_status(self, client, db, admin_auth_headers, admin):
        """Test updating user status."""

        
        # Create regular user
        user_data, _ = random_user_in_db()
        user = User(**user_data.model_dump())
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Get token for admin

        response = client.patch(
            f"/api/v1/admin/users/{user.id}/status",
            params={"new_status": "INACTIVE"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user.id)

    def test_update_user_role(self, client, db, admin_auth_headers, admin):
        """Test updating user role."""

        
        # Create regular user
        user_data, _ = random_user_in_db()
        user = User(**user_data.model_dump())
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Get token for admin

        response = client.patch(
            f"/api/v1/admin/users/{user.id}/role",
            params={"new_role": "STUDENT"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(user.id)

    def test_delete_user(self, client, db, admin_auth_headers, admin):
        """Test deleting (deactivating) a user."""

        # Create regular user
        user_data, _ = random_user_in_db()
        user = User(**user_data.model_dump())
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Get token for admin

        response = client.delete(f"/api/v1/admin/users/{user.id}", headers=admin_auth_headers)
        
        assert response.status_code == 200
        assert "désactivé" in response.json()["message"].lower()

    def test_cannot_delete_self(self, client, db, admin_auth_headers, admin):
        """Test that admin cannot delete their own account."""

        
        # Get token for admin

        response = client.delete(f"/api/v1/admin/users/{admin.id}", headers=admin_auth_headers)
        
        assert response.status_code == 400
        assert "Cannot delete your own account" in response.json()["detail"]

    def test_search_users(self, client, db, admin_auth_headers, admin):
        """Test searching users."""

        
        # Get token for admin

        response = client.get(
            "/api/v1/admin/users/search?q=test&limit=10",
            # params={"q": "test", "limit": 10},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "query" in data
        assert "users" in data
        assert data["query"] == "test"


class TestAdminPostEndpoints:
    """Test admin post management endpoints."""

    def test_get_all_posts(self, client, db, admin_auth_headers, admin):
        """Test getting all posts."""

        
        # Get token for admin

        response = client.get("/api/v1/admin/posts", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "posts" in data

    def test_get_post_by_id(self, client, db, admin_auth_headers, admin):
        """Test getting a specific post."""

        
        # Create a test post
        post = Post(
            title="Test Post",
            description="Test content",
            post_type=PostType.ANNONCE,
            user_id=admin.id
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        

        response = client.get(f"/api/v1/admin/posts/{post.id}", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == post.id

    def test_delete_post(self, client, db, admin_auth_headers, admin):
        """Test deleting a post."""

        # Create a test post
        post = Post(
            title="Test Post to Delete",
            description="Test content",
            post_type=PostType.DEVOIR,
            user_id=admin.id
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        # Get token for admin

        response = client.delete(f"/api/v1/admin/posts/{post.id}", headers=admin_auth_headers)
        
        print(response.json())
        assert response.status_code == 200
        assert "supprimé" in response.json()["message"].lower()
    
    def test_update_post_status(self, client, db, admin_auth_headers, admin):
        post = Post(
            title="Test Post to Delete",
            description="Test content",
            post_type=PostType.DEVOIR,
            user_id=admin.id
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        response = client.patch(f"/api/v1/admin/posts/{post.id}/status?new_status=INACTIVE", headers=admin_auth_headers)
        
        data = response.json()
        print(data)
        assert data["message"] == "Statut mis à jour avec succès."

        post = db.query(Post).filter(Post.id == post.id).first()
        assert post.status == PostStatus.INACTIVE


    def test_get_post_statistics(self, client, db, admin_auth_headers, admin):
        """Test getting post statistics."""

        response = client.get("/api/v1/admin/posts/statistics", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_posts" in data
        assert "type_counts" in data


class TestAdminCommentEndpoints:
    """Test admin comment management endpoints."""

    def test_get_all_comments(self, client, db, admin_auth_headers, admin):
        """Test getting all comments."""

        
        # Get token for admin

        response = client.get("/api/v1/admin/comments", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "comments" in data

    def test_get_comment_by_id(self, client, db, admin_auth_headers, admin):
        """Test getting a specific comment."""

        
        # Create a test post and comment
        post = Post(
            title="Test Post",
            description="Test content",
            post_type=PostType.DEVOIR,
            user_id=admin.id
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        comment = Comment(
            content="Test comment",
            post_id=post.id,
            user_id=admin.id
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        # Get token for admin

        response = client.get(f"/api/v1/admin/comments/{comment.id}", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(comment.id)

    def test_delete_comment(self, client, db, admin_auth_headers, admin):
        """Test deleting a comment."""

        
        # Create a test post and comment
        post = Post(
            title="Test Post for Comment",
            description="Test content",
            post_type=PostType.DEVOIR,
            user_id=admin.id
        )
        db.add(post)
        db.commit()
        db.refresh(post)
        
        comment = Comment(
            content="Test comment to delete",
            post_id=post.id,
            user_id=admin.id
        )
        db.add(comment)
        db.commit()
        db.refresh(comment)
        
        # Get token for admin

        response = client.delete(f"/api/v1/admin/comments/{comment.id}", headers=admin_auth_headers)
        
        assert response.status_code == 200
        assert "supprimé" in response.json()["message"].lower()

    def test_get_comment_statistics(self, client, db, admin_auth_headers, admin):
        """Test getting comment statistics."""

        
        # Get token for admin

        response = client.get("/api/v1/admin/comments/statistics", headers=admin_auth_headers)
        
        data = response.json()
        print(data)
        assert response.status_code == 200
        assert "total_comments" in data
        assert "reply_count" in data


class TestAdminStatistics:
    """Test admin statistics endpoint."""

    def test_get_statistics(self, client, db, admin_auth_headers, admin):
        """Test getting overall statistics."""

        
        # Create regular user
        user_data, _ = random_user_in_db()
        user = User(**user_data.model_dump())
        db.add(user)
        db.commit()
        
        # Get token for admin

        response = client.get("/api/v1/admin/statistics", headers=admin_auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert "total_users" in data
        assert "active_users" in data
        assert "pending_users" in data
        assert "admin_count" in data
        assert "student_count" in data
        assert "domain_counts" in data


class TestAdminFilters:
    """Test admin filtering capabilities."""

    def test_filter_users_by_role(self, client, db, admin_auth_headers, admin):
        """Test filtering users by role."""

        
        # Get token for admin

        response = client.get(
            "/api/v1/admin/users",
            params={"role": "STUDENT"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data

    def test_filter_users_by_status(self, client, db, admin_auth_headers, admin):
        """Test filtering users by status."""

        
        # Get token for admin

        response = client.get(
            "/api/v1/admin/users",
            params={"status": "ACTIVE"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "users" in data

    def test_filter_posts_by_type(self, client, db, admin_auth_headers, admin):
        """Test filtering posts by type."""

        
        # Create test posts with different types
        post1 = Post(
            title="Event Post",
            description="Event description",
            post_type=PostType.DEVOIR,
            user_id=admin.id
        )
        post2 = Post(
            title="Announcement Post",
            description="Announcement description",
            post_type="ANNOUNCEMENT",
            user_id=admin.id
        )
        db.add(post1)
        db.add(post2)
        db.commit()
        
        # Get token for admin

        response = client.get(
            "/api/v1/admin/posts",
            params={"post_type": PostType.DEVOIR},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data

    def test_pagination(self, client, db, admin_auth_headers, admin):
        """Test pagination parameters."""

        
        # Get token for admin

        response = client.get(
            "/api/v1/admin/users",
            params={"skip": 0, "limit": 10},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "total" in data
        assert "users" in data