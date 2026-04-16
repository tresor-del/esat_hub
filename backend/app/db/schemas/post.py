# app/db/schemas/post.py (VERSION MISE À JOUR)
from sqlalchemy import UUID, Column, Integer, String, Text, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid
from app.db.database import Base


class PostType(str, enum.Enum):
    PHOTO = "photo"
    DOCUMENT = "document"
    ANNONCE = "annonce"
    COURS = "cours"
    DEVOIR = "devoir"
    EVENEMENT = "evenement"


class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    post_type = Column(Enum(PostType), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    mime_type = Column(String(100), nullable=True)
    
    # Relation avec l'utilisateur
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    user = relationship("User", back_populates="posts")
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comments = relationship("Comment", back_populates="post", cascade="all, delete-orphan")

    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=True)
    post_room = relationship("Room", back_populates="posts")
    
    def __repr__(self):
        return f"<Post {self.id}: {self.title} by User {self.user_id}>"