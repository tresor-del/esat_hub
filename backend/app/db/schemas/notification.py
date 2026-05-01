import datetime
import uuid

from sqlalchemy import Boolean, Column, String, Integer, UUID, Text, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.UTC))

    recipient_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="notifications")

    sender_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    sender = relationship("User", foreign_keys=[sender_id])

    post_id = Column(Integer, ForeignKey("posts.id"), index=True,  nullable=True)
    post_rel = relationship("Post", back_populates="notifications")

    comment_id = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), index=True, nullable=True)
    comment_rel = relationship("Comment", back_populates="notifications")

