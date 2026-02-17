# app/db/schemas/like.py
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UUID, UniqueConstraint
from sqlalchemy.orm import relationship
from datetime import datetime
from app.db.database import Base


class Like(Base):
    __tablename__ = "likes"
    
    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relations
    post = relationship("Post", back_populates="likes")
    user = relationship("User", back_populates="likes")
    
    # Contrainte : un utilisateur ne peut liker qu'une seule fois un post
    __table_args__ = (
        UniqueConstraint('post_id', 'user_id', name='unique_post_user_like'),
    )
    
    def __repr__(self):
        return f"<Like post_id={self.post_id} user_id={self.user_id}>"