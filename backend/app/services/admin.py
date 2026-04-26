from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.db.schemas.user import User, UserRole, UserStatus
from app.db.schemas.post import Post
from app.db.schemas.comments import Comment
from app.models.user import UserResponse
from app.models.notifications import NotificationResponse


class AdminService:
    """Service for admin-specific operations."""

    def __init__(self, db: Session):
        self._db = db

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

    def get_statistics(self) -> dict:
        """Get overall statistics."""
        total_users = self._db.query(User).count()
        active_users = self._db.query(User).filter(User.status == UserStatus.ACTIVE).count()
        pending_users = self._db.query(User).filter(User.status == UserStatus.PENDING).count()

        # Count by role
        admin_count = self._db.query(User).filter(User.role == UserRole.ADMIN).count()
        student_count = self._db.query(User).filter(User.role == UserRole.STUDENT).count()

        # Count by domain
        domain_counts = {}
        domains = self._db.query(User.domain, func.count(User.id)).group_by(User.domain).all()
        for domain, count in domains:
            domain_counts[domain] = count

        return {
            "total_users": total_users,
            "active_users": active_users,
            "pending_users": pending_users,
            "admin_count": admin_count,
            "student_count": student_count,
            "domain_counts": domain_counts
        }

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

    # ============================================
    # Post Management
    # ============================================

    def get_all_posts(
        self,
        skip: int = 0,
        limit: int = 100,
        post_type: Optional[str] = None
    ) -> tuple[List[Post], int]:
        """Get all posts with optional filters."""
        query = self._db.query(Post)

        if post_type:
            query = query.filter(Post.post_type == post_type)

        total = query.count()
        posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

        return posts, total

    def get_post_by_id(self, post_id: int) -> Optional[Post]:
        """Get a post by ID."""
        return self._db.query(Post).filter(Post.id == post_id).first()

    def delete_post(self, post_id: int) -> bool:
        """Delete a post by ID."""
        post = self.get_post_by_id(post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found")

        self._db.delete(post)
        self._db.commit()
        return True

    def get_post_statistics(self) -> dict:
        """Get post statistics."""
        total_posts = self._db.query(Post).count()
        
        # Count by type
        type_counts = {}
        types = self._db.query(Post.post_type, func.count(Post.id)).group_by(Post.post_type).all()
        for post_type, count in types:
            type_counts[post_type] = count if post_type else "unknown"

        return {
            "total_posts": total_posts,
            "type_counts": type_counts
        }

    # ============================================
    # Comment Management
    # ============================================

    def get_all_comments(
        self,
        skip: int = 0,
        limit: int = 100,
        post_id: Optional[int] = None
    ) -> tuple[List[Comment], int]:
        """Get all comments with optional filters."""
        query = self._db.query(Comment)

        if post_id:
            query = query.filter(Comment.post_id == post_id)

        total = query.count()
        comments = query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

        return comments, total

    def get_comment_by_id(self, comment_id: UUID) -> Optional[Comment]:
        """Get a comment by ID."""
        return self._db.query(Comment).filter(Comment.id == comment_id).first()

    def delete_comment(self, comment_id: UUID) -> bool:
        """Delete a comment by ID."""
        comment = self.get_comment_by_id(comment_id)
        if not comment:
            raise ValueError(f"Comment {comment_id} not found")

        self._db.delete(comment)
        self._db.commit()
        return True

    def get_comment_statistics(self) -> dict:
        """Get comment statistics."""
        total_comments = self._db.query(Comment).count()
        
        # Count comments with parent (replies)
        reply_count = self._db.query(Comment).filter(Comment.parent_id.isnot(None)).count()

        return {
            "total_comments": total_comments,
            "reply_count": reply_count
        }

    # ============================================
    # Notification Helper
    # ============================================

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