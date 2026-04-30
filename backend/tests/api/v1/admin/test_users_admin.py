from uuid import uuid4
from tests.utils import random_user_in_db

from app.db.schemas.user import User


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

