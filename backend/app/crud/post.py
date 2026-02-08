from sqlalchemy.orm import Session
from app.models.post import Post, PostType as PostTypeModel
from app.schemas.post import PostCreate, PostUpdate
from typing import Optional, List
from fastapi import HTTPException, status

def create_post(
    db: Session,
    title: str,
    description: Optional[str],
    post_type: str,
    file_path: str,
    file_name: str,
    mime_type: Optional[str]
) -> Post:
    """Créer un nouveau poste"""
    db_post = Post(
        title=title,
        description=description,
        post_type=PostTypeModel(post_type),
        file_path=file_path,
        file_name=file_name,
        mime_type=mime_type
    )
    db.add(db_post)
    db.commit()
    db.refresh(db_post)
    return db_post

def get_post(db: Session, post_id: int) -> Optional[Post]:
    """Récupérer un poste par ID"""
    return db.query(Post).filter(Post.id == post_id).first()

def get_posts(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    post_type: Optional[str] = None
) -> tuple[List[Post], int]:
    """Récupérer tous les postes avec pagination et filtrage optionnel"""
    query = db.query(Post)
    
    if post_type:
        query = query.filter(Post.post_type == PostTypeModel(post_type))
    
    total = query.count()
    posts = query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    return posts, total

def update_post(
    db: Session,
    post_id: int,
    post_update: PostUpdate
) -> Optional[Post]:
    """Mettre à jour un poste"""
    db_post = get_post(db, post_id)
    
    if not db_post:
        return None
    
    update_data = post_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(db_post, field, value)
    
    db.commit()
    db.refresh(db_post)
    return db_post

def delete_post(db: Session, post_id: int) -> bool:
    """Supprimer un poste"""
    db_post = get_post(db, post_id)
    
    if not db_post:
        return False
    
    db.delete(db_post)
    db.commit()
    return True

def search_posts(
    db: Session,
    query: str,
    skip: int = 0,
    limit: int = 100
) -> tuple[List[Post], int]:
    """Rechercher des postes par titre ou description"""
    search_query = db.query(Post).filter(
        (Post.title.ilike(f"%{query}%")) | 
        (Post.description.ilike(f"%{query}%"))
    )
    
    total = search_query.count()
    posts = search_query.order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    
    return posts, total