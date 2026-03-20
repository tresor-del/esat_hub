from datetime import datetime
import uuid
from sqlalchemy import UUID, Column, ForeignKey, Text, TIMESTAMP
from sqlalchemy.orm import relationship
from app.db.database import Base

class Message(Base):

    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), index=True, default=uuid.uuid4(), primary_key=True)
    sender = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiver = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(TIMESTAMP, default=datetime.utcnow)
    update_at = Column(TIMESTAMP, default=datetime.utcnow)

    # user_sender = relationship("User",foreign_keys=[sender], back_populates="sender_message")
    # user_receiver = relationship("User", foreign_keys=[receiver], back_populates="receiver_message")