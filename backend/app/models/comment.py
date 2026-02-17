# app/models/comment.py
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID
from typing import Optional


class CommentBase(BaseModel):
    """Base pour Comment"""
    content: str = Field(..., min_length=1, max_length=2000, description="Contenu du commentaire")


class CommentCreate(CommentBase):
    """Création d'un commentaire"""
    pass


class CommentUpdate(BaseModel):
    """Mise à jour d'un commentaire"""
    content: Optional[str] = Field(None, min_length=1, max_length=2000)


class CommentResponse(CommentBase):
    """Réponse avec un commentaire"""
    id: int
    post_id: int
    user_id: UUID
    created_at: datetime
    updated_at: datetime
    
    # Info utilisateur (ajouté dynamiquement par le service)
    user_email: Optional[str] = None
    
    class Config:
        from_attributes = True


class CommentListResponse(BaseModel):
    """Liste de commentaires avec pagination"""
    total: int
    comments: list[CommentResponse]