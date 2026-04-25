import uuid, datetime
from sqlalchemy import Integer, Column, UUID, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base

class Comment(Base):
    __tablename__ = "comments"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, index=True, default=lambda: datetime.datetime.now(datetime.UTC))
    edited_at = Column(DateTime, index=True, default=lambda: datetime.datetime.now(datetime.UTC), onupdate=lambda: datetime.datetime.now(datetime.UTC))

    post_id = Column(Integer, ForeignKey("posts.id"), nullable=False)
    post = relationship("Post", back_populates="comments")

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="comments")

    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    # un commentaire peut répondre à un autre commentaire
    parent = relationship("Comment", back_populates="replies", remote_side=[id])
    # un commentaire peut avoir plusieurs réponses
    replies = relationship("Comment", back_populates="parent")