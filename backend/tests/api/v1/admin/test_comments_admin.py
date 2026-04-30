import pytest
from uuid import uuid4
from fastapi.testclient import TestClient

from app.db.schemas.user import User, UserRole, UserStatus
from app.db.schemas.post import Post, PostStatus, PostType
from app.db.schemas.comments import Comment
from tests.utils import random_user_in_db


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

