from sqlalchemy import Column, Integer, String, Text, DateTime, Enum
from datetime import datetime
import enum

from app.db.database import Base

class PostType(str, enum.Enum):
    PHOTO = "photo"
    DOCUMENT = "document"

class Post(Base):
    __tablename__ = "posts"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    post_type = Column(Enum(PostType), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    mime_type = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Post {self.id}: {self.title}>"