# app/services/post_service.py (VERSION COMPLÈTE)
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.db.schemas.post import Post
from app.db.schemas.user import User


class PostService:
    def __init__(self, session: Session):
        self._db = session
    
    # ==================== POSTS ====================
    
    def create_post(
        self,
        title: str,
        post_type: str,
        file_path: str,
        file_name: str,
        user_id: UUID,
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
        self._db.add(db_post)
        self._db.commit()
        self._db.refresh(db_post)
        return db_post
    
    def get_posts(
        self,
        skip: int = 0,
        limit: int = 100,
        post_type: Optional[str] = None,
        user_id: Optional[UUID] = None,
        room_id: Optional[UUID] = None
    ) -> Tuple[List[dict], int]:
        """
        Récupère les posts avec compteurs de likes et comments
        """
        query = self._db.query(
            Post
        ).group_by(Post.id)

        # Filtres
        if post_type:
            query = query.filter(Post.post_type == post_type)
        if user_id:
            query = query.filter(Post.user_id == user_id)
        if room_id is not None:
            query = query.filter(Post.room_id == room_id)
        else:
            # Pour les posts généraux, exclure ceux avec room_id
            query = query.filter(Post.room_id.is_(None))
        
        # Total
        total = query.count()
        
        # Pagination et tri
        results = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
        
        # Charger les infos utilisateur
        posts_with_info = []
        for post in results:
            # Charger l'utilisateur
            user = self._db.query(User).filter(User.id == post.user_id).first()
            
            post_dict = {
                "id": post.id,
                "title": post.title,
                "description": post.description,
                "post_type": post.post_type,
                "file_path": post.file_path,
                "file_name": post.file_name,
                "mime_type": post.mime_type,
                "user_id": post.user_id,
                "created_at": post.created_at,
                "updated_at": post.updated_at,
                "user": {"id": user.id, "username": user.username} if user else None
            }
            posts_with_info.append(post_dict)
        
        return posts_with_info, total
     
    def get_post(
        self, 
        post_id: int, 
        current_user_id: Optional[UUID] = None
    ) -> Optional[dict]:
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
        
        return {
            "id": post.id,
            "title": post.title,
            "description": post.description,
            "post_type": post.post_type,
            "file_path": post.file_path,
            "file_name": post.file_name,
            "mime_type": post.mime_type,
            "user_id": post.user_id,
            "created_at": post.created_at,
            "updated_at": post.updated_at,
            "user": {"id": user.id, "username": user.username} if user else None
        }
    
    def update_post(
        self,
        post_id: int,
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
    
    def delete_post(self, post_id: int) -> bool:
        db_post = self._db.query(Post).filter(Post.id == post_id).first()
        
        if db_post is None:
            return False
        
        self._db.delete(db_post)
        self._db.commit()
        return True
    
