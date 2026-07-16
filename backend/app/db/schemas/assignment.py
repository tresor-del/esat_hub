import enum
import uuid

from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy import Enum, Boolean, Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship

from app.db.database import Base

class AssignmentStatus(str, enum.Enum):
    DRAFT = "DRAFT"          
    PUBLISHED = "PUBLISHED" 
    CLOSED = "CLOSED"    
    ARCHIVED = "ARCHIVED"

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    
    teacher_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), nullable=False) 
    
    subject = Column(String, nullable=True) 
    due_date = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relations
    teacher = relationship("User", foreign_keys=[teacher_id], back_populates="assignments_created")
    room = relationship("Room", back_populates="assignments")
    media = relationship("Media", back_populates="assignment", cascade="all, delete-orphan")
    submissions = relationship("AssignmentSubmission", back_populates="assignment", cascade="all, delete-orphan")
    
    status = Column(
        Enum(AssignmentStatus, name="assignmentstatus", values_callable=lambda x: [e.value for e in x]),
        nullable=False,
        index=True,
        server_default=AssignmentStatus.DRAFT.value
    )
    
    
class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    is_late = Column(Boolean, default=False)  # calculé vs assignment.due_date
    
    grade = Column(Integer, nullable=True)
    feedback = Column(String, nullable=True)
    
    # Contrainte : un étudiant ne peut soumettre qu'une fois par devoir (ou versionner si tu veux permettre les resoumissions)
    __table_args__ = (UniqueConstraint('assignment_id', 'student_id', name='uq_assignment_student'),)

    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("User", foreign_keys=[student_id])
    media = relationship("Media", back_populates="submission", cascade="all, delete-orphan")
    
    