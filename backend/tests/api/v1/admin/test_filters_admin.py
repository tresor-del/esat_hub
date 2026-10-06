from app.db.schemas.post import Post, PostType
from app.db.schemas.user import User, UserRole, UserStatus
from tests.utils import random_user_in_db


class TestAdminFilters:
    """Test admin filtering capabilities."""

    def test_filter_users_by_role(self, client, db, admin_auth_headers, admin):
        """Test filtering users by role."""
        user_data, _ = random_user_in_db()
        user_data.role = UserRole.STUDENT
        student = User(**user_data.model_dump())
        db.add(student)
        db.commit()
        response = client.get(
            "/api/v1/admin/users",
            params={"role": "STUDENT"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert any(user["id"] == str(student.id) for user in data["users"])
        assert all(user["role"] == UserRole.STUDENT.value for user in data["users"])

    def test_filter_users_by_status(self, client, db, admin_auth_headers, admin):
        """Test filtering users by status."""
        user_data, _ = random_user_in_db()
        user_data.status = UserStatus.PENDING
        pending_user = User(**user_data.model_dump())
        db.add(pending_user)
        db.commit()
        response = client.get(
            "/api/v1/admin/users",
            params={"status": "ACTIVE"},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
        assert all(user["status"] == UserStatus.ACTIVE.value for user in data["users"])
        assert all(user["id"] != str(pending_user.id) for user in data["users"])

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
            post_type=PostType.ANNONCE,
            user_id=admin.id
        )
        db.add(post1)
        db.add(post2)
        db.commit()
        
        # Get token for admin

        response = client.get(
            "/api/v1/admin/posts",
            params={"post_type": PostType.DEVOIR.value},
            headers=admin_auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert len(data["posts"]) == 1
        assert data["posts"][0]["id"] == str(post1.id)
        assert data["posts"][0]["post_type"] == PostType.DEVOIR.value

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
        assert len(data["users"]) <= 10