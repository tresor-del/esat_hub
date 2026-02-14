from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.schemas.post import Post
from app.models.post import PostUpdate


class PostService:
    
    def __init__(self, session: Session):
        self._db = session
    
    def create_post(
        self,
        title: str,
        post_type: str,
        file_path: str,
        file_name: str,
        user_id: UUID,  # Ajout du paramètre user_id
        description: Optional[str] = None,
        mime_type: Optional[str] = None
    ) -> Post:
            
        db_post = Post(
            title=title,
            description=description,
            post_type=post_type,
            file_path=file_path,
            file_name=file_name,
            mime_type=mime_type,
            user_id=user_id  # Ajout de l'utilisateur
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
        user_id: Optional[UUID] = None  # Ajout du paramètre user_id
    ) -> Tuple[List[Post], int]:
        
        query = self._db.query(Post)
        
        if post_type:
            query = query.filter(Post.post_type == post_type)
        
        if user_id:
            query = query.filter(Post.user_id == user_id)
        
        total = query.count()
        posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
        
        return posts, total


    def search_posts(
        self,
        query: str,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[UUID] = None  # Ajout du paramètre user_id
    ) -> Tuple[List[Post], int]:
        db_query = self._db.query(Post).filter(
            (Post.title.ilike(f"%{query}%")) | 
            (Post.description.ilike(f"%{query}%"))
        )
        
        if user_id:
            db_query = db_query.filter(Post.user_id == user_id)
        
        total = db_query.count()
        posts = db_query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
        
        return posts, total


    def get_post(self, post_id: int) -> Optional[Post]:
        return self._db.query(Post).filter(Post.id == post_id).first()


    def update_post(self, post_id: int, post_update: PostUpdate) -> Optional[Post]:
        db_post = self.get_post(post_id)
        
        if db_post is None:
            return None
        
        update_data = post_update.model_dump(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(db_post, field, value)
        
        self._db.commit()
        self._db.refresh(db_post)
        
        return db_post


    def delete_post(self, post_id: int) -> bool:
        db_post = self.get_post(post_id)
        
        if db_post is None:
            return False
        
        self._db.delete(db_post)
        self._db.commit()
        
        return True