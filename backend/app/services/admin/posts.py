from typing import List, Optional
from uuid import UUID
from sqlalchemy import func

from app.db.schemas.post import Post
from app.db.schemas.post import Post, PostStatus
from app.services.admin.base import BaseAdminService
from app.models.post import PostListResponse, PostResponse, PostStatsResponse


class AdminPostsService(BaseAdminService):

    def get_all_posts(
        self,
        skip: int = 0,
        limit: int = 100,
        post_type: Optional[str] = None,
        status: Optional[str] = None,
        room_id: Optional[UUID] = None
    ) -> PostListResponse:
        """
        Retourne tous les posts avec filtre optionnel.
        """
        query = self._db.query(Post)

        # Filtre par type
        if post_type:
            query = query.filter(Post.post_type == post_type)
        
        # Filtre par status
        if status:
            query = query.filter(Post.status == status.upper())
        
        # Filtre par salle
        if room_id is not None:
            if str(room_id) == "0":
                # filtre pour les posts généraux
                query = query.filter(Post.room_id == None)
            else:
                query = query.filter(Post.room_id == room_id)

        total = query.count()
        posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()

        return PostListResponse(total=total, posts=posts)

    def get_post_by_id(self, post_id: int) -> Optional[Post]:
        """
        Retourne un post par id
        """
        post = self._db.query(Post).filter(Post.id == post_id).first()

        return post

    def delete_post(self, post_id: int) -> bool:
        """
        Supprimer un post par id.
        """
        post = self.get_post_by_id(post_id)
        if not post:
            raise ValueError(f"Post {post_id} not found")

        self._db.delete(post)
        self._db.commit()
        return True

    def get_post_statistics(self) -> PostStatsResponse:
        """
        Retourne les statistique d'un post.
        """
        total_posts = self._db.query(Post).count()
        
        # Nombre par type
        type_counts = {}
        types = self._db.query(Post.post_type, func.count(Post.id)).group_by(Post.post_type).all()
        for post_type, count in types:
            type_counts[post_type] = count if post_type else "unknown"

        return PostStatsResponse(total_posts=total_posts, type_counts=type_counts)
    
    def update_post_status(self, post_id: int, new_status: str) -> None:
        """
        Mettre à jour le statut d'un post.
        """
        post = self.get_post_by_id(post_id)
        if not post:
            raise ValueError(f"Post {post_id} non trouvé")

        post.status = str(new_status.upper())
        self._db.commit()
        self._db.refresh(post)