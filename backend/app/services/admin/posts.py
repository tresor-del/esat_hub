from typing import List, Optional
from sqlalchemy import func

from app.db.schemas.post import Post
from app.db.schemas.post import Post, PostStatus
from app.services.admin.base import BaseAdminService



class AdminPostsService(BaseAdminService):

    def get_all_posts(
        self,
        skip: int = 0,
        limit: int = 100,
        post_type: Optional[str] = None,
        status: Optional[str] = None,
        room_id: Optional[int] = None
    ) -> tuple[List[Post], int]:
        """Get all posts with optional filters."""
        query = self._db.query(Post)

        if post_type:
            query = query.filter(Post.post_type == post_type)
        
        if status:
            query = query.filter(Post.status == status.upper())
        
        if room_id is not None:
            if room_id == 0:
                # Filter for general posts (room_id is NULL)
                query = query.filter(Post.room_id == None)
            else:
                query = query.filter(Post.room_id == room_id)

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
    
    def update_post_status(self, post_id: int, new_status: str):
        """Update a user's status."""
        post = self.get_post_by_id(post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found")

        post.status = str(new_status.upper())
        self._db.commit()
        self._db.refresh(post)