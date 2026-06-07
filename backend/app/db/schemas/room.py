import datetime
import enum
import uuid
from sqlalchemy import Boolean, Column, UUID, DateTime, ForeignKey, Enum, String, UniqueConstraint
from sqlalchemy.orm import relationship

from app.db.database import Base

class RoomNames(str, enum.Enum):
    PREPA_1 = "PREPA_1"
    PREPA_2 = "PREPA_2"
    INGE_1 = "INGE_1"
    INGE_2 = "INGE_2"
    INGE_3 = "INGE_3"

class Room(Base):
    __tablename__ = "rooms"

    id = Column(UUID(as_uuid=True), index=True, primary_key=True, default=uuid.uuid4)
    name = Column(Enum(RoomNames), nullable=False, index=True)
    
    users = relationship("User", back_populates="user_room", foreign_keys="User.user_room_id")

    rep_id = Column(UUID(as_uuid=True), ForeignKey("users.id", use_alter=True), nullable=True)
    rep = relationship("User", back_populates="room_rep", foreign_keys=[rep_id])

    posts = relationship("Post", back_populates="post_room")

    media = relationship("Media", back_populates="room", cascade="all, delete-orphan")
    course_sessions = relationship("CourseSession", back_populates="session_room")


# tables pour le systeme de présence aux cours. 
class SessionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    CLOSED = "CLOSED"

class CourseSession(Base):
    __tablename__ = "course_sessions"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course     = Column(String, nullable=False)   
    session_author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    qr_token   = Column(String, unique=True, nullable=False) 
    expires_at = Column(DateTime, nullable=False)
    status     = Column(Enum(SessionStatus), default=SessionStatus.ACTIVE)
    created_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))

    room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"))
    session_room = relationship("Room", back_populates="course_sessions")

    session_author = relationship("User", back_populates="course_sessions", foreign_keys=[session_author_id])
    attendance_records = relationship("AttendanceRecord", back_populates="session")


class AttendanceRecord(Base):
    __tablename__ = "attendance_records"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("course_sessions.id"))
    student_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    scanned_at = Column(DateTime, default=lambda: datetime.datetime.now(datetime.timezone.utc))
    is_present = Column(Boolean, default=True)

    session = relationship("CourseSession", back_populates="attendance_records")
    student = relationship("User", back_populates="attendance_records")

    __table_args__ = (
        # Un étudiant ne peut pas se marquer deux fois
        UniqueConstraint("session_id", "student_id"),
    )