from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session, joinedload, selectinload
from sqlalchemy import func, select

from app.db.schemas.post import Post, PostLike
from app.db.schemas.comments import Comment
from app.db.schemas.user import User
import logging

from sqlalchemy.exc import IntegrityError
logger = logging.getLogger(__name__)


class PostService:
    def __init__(self, session: Session):
        self._db = session
    
    
    def create_post(
        self,
        title: str,
        post_type: str,
        user_id: UUID,
        file_path: Optional[str] = None,
        file_name: Optional[str] = None,
        description: Optional[str] = None,
        mime_type: Optional[str] = None,
        room_id: Optional[UUID] = None
    ) -> Post:
        db_post = Post(
            title=title,
            description=description,
            post_type=post_type,
            file_path=file_path,
            file_name=file_name,
            mime_type=mime_type,
            user_id=user_id,
            room_id=room_id
        )
        try:
            self._db.add(db_post)
            self._db.commit()
            self._db.refresh(db_post)
            return db_post
        except:
            self._db.rollback()
            raise
        
    def get_posts(
        self,
        skip: int = 0,
        limit: int = 100,
        post_type: Optional[str] = None,
        user_id: Optional[UUID] = None,
        room_id: Optional[UUID] = None,
        include_all: bool = False,
        current_user_id: Optional[UUID] = None
    ) -> Tuple[List[dict], int]:
        """
        Récupère les posts avec compteurs de likes et comments
        """
        
        stmt = select(Post).where(Post.status == "ACTIVE")
        count_stmt = select(func.count(Post.id)).where(Post.status == "ACTIVE")
        
        # Ajouter les relations
        stmt = stmt.add_columns(
            select(func.count(Comment.id))
            .where(Comment.post_id == Post.id)
            .scalar_subquery()
            .label("comments_count")
        )

        # Filtres
        if post_type:
            stmt = stmt.where(Post.post_type == post_type)
            count_stmt = count_stmt.where(Post.post_type == post_type)
            
        if user_id:
            stmt = stmt.where(Post.user_id == user_id)
            count_stmt = count_stmt.where(Post.user_id == user_id)
            include_all = True
        
        # Gestion du room_id
        if room_id is not None:
            # Posts d'une salle spécifique
            stmt = stmt.where(Post.room_id == room_id)
            count_stmt = count_stmt.where(Post.room_id == room_id)

        elif not include_all:
            stmt = stmt.where(Post.room_id.is_(None))
            count_stmt = count_stmt.where(Post.room_id.is_(None))
        
        # Total
        total = self._db.execute(count_stmt).scalar()
        
        # Pagination et tri
        results = self._db.execute(
            stmt.order_by(Post.created_at.desc()).offset(skip).limit(limit)
        ).all()
        
        posts = []
        for post, count in results:
            post.comments_count = count
            post.likes_count = self._db.query(func.count(PostLike.id)).filter(PostLike.post_id == post.id).scalar() or 0
            post.liked_by_me = False
            if current_user_id:
                post.liked_by_me = self._db.query(PostLike.id).filter(
                    PostLike.post_id == post.id,
                    PostLike.user_id == current_user_id
                ).first() is not None
            posts.append(post)
        
        return posts, total
     
    def get_post(
        self, 
        post_id: UUID, 
        current_user_id: Optional[UUID] = None
    ) :
        """
        Récupère un post avec ses compteurs
        """
        result = self._db.query(
            Post
        ).filter(
            Post.id == post_id
        ).group_by(Post.id).first()
        
        if not result:
            return None
        
        post = result
        
        # Charger l'utilisateur
        user = self._db.query(User).filter(User.id == post.user_id).first()
        post.likes_count = self._db.query(func.count(PostLike.id)).filter(PostLike.post_id == post.id).scalar() or 0
        post.liked_by_me = False
        if current_user_id:
            post.liked_by_me = self._db.query(PostLike.id).filter(
                PostLike.post_id == post.id,
                PostLike.user_id == current_user_id
            ).first() is not None
        
        return post
    
    def update_post(
        self,
        post_id: UUID,
        title: Optional[str] = None,
        description: Optional[str] = None,
        post_type: Optional[str] = None,
        file_path: Optional[str] = None,
        file_name: Optional[str] = None,
        mime_type: Optional[str] = None
    ) -> Optional[Post]:
        db_post = self._db.query(Post).filter(Post.id == post_id).first()
        
        if db_post is None:
            return None
        
        # Mettre à jour uniquement les champs fournis
        if title is not None:
            db_post.title = title
        if description is not None:
            db_post.description = description
        if post_type is not None:
             db_post.post_type = post_type
        if file_path is not None:
             db_post.file_path = file_path
        if file_name is not None:
             db_post.file_name = file_name
        if mime_type is not None:
             db_post.mime_type = mime_type
        
        self._db.commit()
        self._db.refresh(db_post)
        return db_post
    
    def delete_post(self, post_id: UUID) -> bool:
        db_post = self._db.query(Post).filter(Post.id == post_id).first()
        
        if db_post is None:
            return False
        
        self._db.delete(db_post)
        self._db.commit()
        return True

    def toggle_like(self, post_id: UUID, user_id: UUID) -> Optional[dict]:
        db_post = self._db.query(Post).filter(Post.id == post_id).first()
        if db_post is None:
            return None

        existing_like = self._db.query(PostLike).filter(
            PostLike.post_id == post_id,
            PostLike.user_id == user_id,
        ).with_for_update().first()

        if existing_like:
            self._db.delete(existing_like)
            liked_by_me = False
            try:
                self._db.commit()
            except Exception:
                self._db.rollback()
                raise
        else:
            try:
                self._db.add(PostLike(post_id=post_id, user_id=user_id))
                self._db.commit()
                liked_by_me = True
            except IntegrityError:
                self._db.rollback()
                liked_by_me = True

        likes_count = self._db.query(func.count(PostLike.id)).filter(
            PostLike.post_id == post_id
        ).scalar() or 0
        return {"post_id": post_id, "liked_by_me": liked_by_me, "likes_count": likes_count}

