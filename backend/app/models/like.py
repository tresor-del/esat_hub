# app/models/like.py
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID


class LikeBase(BaseModel):
    """Base pour Like"""
    pass


class LikeCreate(LikeBase):
    """Création d'un Like (pas de champs requis, juste post_id dans l'URL)"""
    pass


class LikeResponse(LikeBase):
    """Réponse avec un Like"""
    id: int
    post_id: int
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True