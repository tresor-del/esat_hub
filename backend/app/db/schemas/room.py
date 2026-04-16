import enum
import uuid
from sqlalchemy import Column, UUID, ForeignKey, Enum
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

    rep_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    rep = relationship("User", back_populates="room_rep", foreign_keys=[rep_id])

    posts = relationship("Post", back_populates="post_room")