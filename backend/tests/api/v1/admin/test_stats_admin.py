from app.db.schemas.user import User
from tests.utils import random_user_in_db


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
