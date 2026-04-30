from app.db.schemas.post import Post, PostStatus, PostType


class TestAdminPostEndpoints:
    """Test admin post management endpoints."""

    def test_get_all_posts(self, client, db, admin_auth_headers, admin):
        """Test getting all posts."""

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

