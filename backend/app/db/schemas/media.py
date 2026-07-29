import datetime
import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Boolean, Column, DateTime, String, ForeignKey
from sqlalchemy.orm import relationship

from app.db.database import Base


class Media(Base):
    __tablename__ = "media"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    user = relationship("User", back_populates="media")

    title = Column(String(255), nullable=True)
    description = Column(String(255), nullable=True)
    file_path = Column(String(500), nullable=True)
    file_name = Column(String(255), nullable=True)
    mime_type = Column(String(100), nullable=True)
    from_teacher = Column(Boolean, nullable=True, default=False)

    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc), onupdate=lambda: datetime.datetime.now(datetime.timezone.utc))

    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=True)
    room = relationship("Room", back_populates="media")
    
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=True)
    assignment = relationship("Assignment", back_populates="media")

    submission_id = Column(UUID(as_uuid=True), ForeignKey("assignment_submissions.id"), nullable=True)
    submission = relationship("AssignmentSubmission", back_populates="media")