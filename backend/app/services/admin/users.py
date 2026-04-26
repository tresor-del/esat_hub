from typing import List, Optional
from uuid import UUID

from app.db.schemas.user import User, UserRole, UserStatus
from app.services.admin.base import BaseAdminService
from app.models.user import UserResponse


class AdminUsersService(BaseAdminService):

    def get_all_users(
        self,
        skip: int = 0,
        limit: int = 100,
        role: Optional[str] = None,
        status: Optional[str] = None,
        domain: Optional[str] = None,
        year: Optional[str] = None
    ) -> tuple[List[User], int]:
        """
        Get all users with optional filters.
        Returns tuple of (users, total_count).
        """
        query = self._db.query(User)

        if role:
            query = query.filter(User.role == UserRole[role.upper()])
        if status:
            query = query.filter(User.status == UserStatus[status.upper()])
        if domain:
            query = query.filter(User.domain == domain)
        if year:
            query = query.filter(User.year == year)

        total = query.count()
        users = query.offset(skip).limit(limit).all()

        return users, total

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        """Get a user by ID."""
        return self._db.query(User).filter(User.id == user_id).first()

    def get_user_by_email(self, email: str) -> Optional[User]:
        """Get a user by email."""
        return self._db.query(User).filter(User.email == email).first()

    def update_user_status(self, user_id: UUID, new_status: str) -> User:
        """Update a user's status."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        user.status = UserStatus[new_status.upper()]
        self._db.commit()
        self._db.refresh(user)
        return user

    def update_user_role(self, user_id: UUID, new_role: str) -> User:
        """Update a user's role."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        user.role = UserRole[new_role.upper()]
        self._db.commit()
        self._db.refresh(user)
        return user

    def delete_user(self, user_id: UUID) -> bool:
        """Delete a user (soft delete by setting status to INACTIVE)."""
        user = self.get_user_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")

        user.status = UserStatus.INACTIVE
        self._db.commit()
        return True

    def search_users(self, query: str, limit: int = 50) -> List[User]:
        """Search users by name, email, or username."""
        search_pattern = f"%{query}%"
        return self._db.query(User).filter(
            (User.first_name.ilike(search_pattern)) |
            (User.last_name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern)) |
            (User.username.ilike(search_pattern)) |
            (User.profil_name.ilike(search_pattern))
        ).limit(limit).all()
    
    def create_user_response(self, user: User) -> UserResponse:
        """Create UserResponse from User model."""
        return UserResponse(
            first_name=user.first_name,
            last_name=user.last_name,
            profil_name=user.profil_name,
            school_name=user.school_name.value if user.school_name else None,
            domain=user.domain.value if user.domain else None,
            level=user.level.value if user.level else None,
            year=user.year.value if user.year else None,
            email=user.email,
            id=user.id,
            is_verified=user.is_verified,
            username=user.username,
            user_room_id=user.user_room_id,
        )