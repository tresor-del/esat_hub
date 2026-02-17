# app/services/post_service.py (VERSION COMPLÈTE)
from typing import List, Optional, Tuple
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from app.db.schemas.post import Post
from app.db.schemas.like import Like
from app.db.schemas.comment import Comment
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
        mime_type: Optional[str] = None
    ) -> Post:
        db_post = Post(
            title=title,
            description=description,
            post_type=post_type,
            file_path=file_path,
            file_name=file_name,
            mime_type=mime_type,
            user_id=user_id
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
        user_id: Optional[UUID] = None
    ) -> Tuple[List[dict], int]:
        """
        Récupère les posts avec compteurs de likes et comments
        """
        query = self._db.query(
            Post,
            func.count(Like.id).label("likes_count"),
            func.count(Comment.id).label("comments_count")
        ).outerjoin(Like).outerjoin(Comment).group_by(Post.id)

        # Filtres
        if post_type:
            query = query.filter(Post.post_type == post_type)
        if user_id:
            query = query.filter(Post.user_id == user_id)
        
        # Total
        total = query.count()
        
        # Pagination et tri
        results = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
        
        # Charger les infos utilisateur
        posts_with_info = []
        for post, likes_count, comments_count in results:
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
                "user": {"id": user.id, "email": user.email} if user else None,
                "likes_count": likes_count or 0,
                "comments_count": comments_count or 0,
                "is_liked_by_current_user": False
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
            Post,
            func.count(Like.id).label('likes_count'),
            func.count(Comment.id).label('comments_count'),
            func.bool_or(Like.user_id == current_user_id).label('is_liked')
        ).outerjoin(Like).outerjoin(Comment).filter(
            Post.id == post_id
        ).group_by(Post.id).first()
        
        if not result:
            return None
        
        post, likes_count, comments_count, is_liked = result
        
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
            "user": {"id": user.id, "email": user.email} if user else None,
            "likes_count": likes_count or 0,
            "comments_count": comments_count or 0,
            "is_liked_by_current_user": bool(is_liked) if is_liked is not None else False
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
    
    def search_posts(
        self,
        query: str,
        skip: int = 0,
        limit: int = 100,
        user_id: Optional[UUID] = None,
        current_user_id: Optional[UUID] = None
    ) -> Tuple[List[dict], int]:
        """Recherche dans les posts"""
        db_query = self._db.query(
            Post,
            func.count(Like.id).label('likes_count'),
            func.count(Comment.id).label('comments_count'),
            func.bool_or(Like.user_id == current_user_id).label('is_liked')
        ).outerjoin(Like).outerjoin(Comment).filter(
            (Post.title.ilike(f"%{query}%")) | 
            (Post.description.ilike(f"%{query}%"))
        ).group_by(Post.id)
        
        if user_id:
            db_query = db_query.filter(Post.user_id == user_id)
        
        total = db_query.count()
        results = db_query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
        
        # Formatter les résultats
        posts_with_info = []
        for post, likes_count, comments_count, is_liked in results:
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
                "user": {"id": user.id, "email": user.email} if user else None,
                "likes_count": likes_count or 0,
                "comments_count": comments_count or 0,
                "is_liked_by_current_user": bool(is_liked) if is_liked is not None else False
            }
            posts_with_info.append(post_dict)
        
        return posts_with_info, total
    
    # ==================== LIKES ====================
    
    def create_like(self, post_id: int, user_id: UUID) -> Like:
        """Créer un like"""
        # Vérifier si l'utilisateur a déjà liké
        existing_like = self._db.query(Like).filter(
            Like.post_id == post_id,
            Like.user_id == user_id
        ).first()
        
        if existing_like:
            raise ValueError("Vous avez déjà liké ce post")
        
        like = Like(post_id=post_id, user_id=user_id)
        self._db.add(like)
        self._db.commit()
        self._db.refresh(like)
        return like
    
    def delete_like(self, post_id: int, user_id: UUID) -> bool:
        """Supprimer un like"""
        like = self._db.query(Like).filter(
            Like.post_id == post_id,
            Like.user_id == user_id
        ).first()
        
        if not like:
            return False
        
        self._db.delete(like)
        self._db.commit()
        return True
    
    def get_likes_count(self, post_id: int) -> int:
        """Obtenir le nombre de likes d'un post"""
        return self._db.query(Like).filter(Like.post_id == post_id).count()
    
    def is_liked_by_user(self, post_id: int, user_id: UUID) -> bool:
        """Vérifier si un utilisateur a liké un post"""
        return self._db.query(Like).filter(
            Like.post_id == post_id,
            Like.user_id == user_id
        ).first() is not None
    
    # ==================== COMMENTS ====================
    
    def create_comment(self, post_id: int, user_id: UUID, content: str) -> Comment:
        """Créer un commentaire"""
        comment = Comment(
            post_id=post_id,
            user_id=user_id,
            content=content
        )
        self._db.add(comment)
        self._db.commit()
        self._db.refresh(comment)
        return comment
    
    def get_comments(
        self,
        post_id: int,
        skip: int = 0,
        limit: int = 100
    ) -> Tuple[List[Comment], int]:
        """Obtenir les commentaires d'un post"""
        query = self._db.query(Comment).filter(Comment.post_id == post_id)
        
        total = query.count()
        comments = query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()
        
        # Ajouter les infos utilisateur
        for comment in comments:
            user = self._db.query(User).filter(User.id == comment.user_id).first()
            if user:
                comment.user_email = user.email
        
        return comments, total
    
    def get_comment(self, comment_id: int) -> Optional[Comment]:
        """Obtenir un commentaire spécifique"""
        return self._db.query(Comment).filter(Comment.id == comment_id).first()
    
    def update_comment(self, comment_id: int, content: str) -> Optional[Comment]:
        """Mettre à jour un commentaire"""
        comment = self._db.query(Comment).filter(Comment.id == comment_id).first()
        
        if not comment:
            return None
        
        comment.content = content
        self._db.commit()
        self._db.refresh(comment)
        return comment
    
    def delete_comment(self, comment_id: int) -> bool:
        """Supprimer un commentaire"""
        comment = self._db.query(Comment).filter(Comment.id == comment_id).first()
        
        if not comment:
            return False
        
        self._db.delete(comment)
        self._db.commit()
        return True