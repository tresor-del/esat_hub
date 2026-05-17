from sqlalchemy import UUID, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship  
from app.db.database import Base
import uuid

class UserDevice(Base):
    __tablename__ = "user_devices"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    device_token = Column(String, unique=True, nullable=False) 

    user = relationship("User", back_populates="devices")
