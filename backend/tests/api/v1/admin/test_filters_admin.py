from app.db.schemas.post import Post, PostType


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