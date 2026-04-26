from typing import List, Optional
from uuid import UUID

from app.db.schemas.comments import Comment
from app.services.admin.base import BaseAdminService


class AdminCommentsService(BaseAdminService):
    
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

    