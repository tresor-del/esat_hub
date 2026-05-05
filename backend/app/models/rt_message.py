from pydantic import BaseModel
from uuid import UUID
from datetime import datetime

from app.models.user import UserResponse


class MessageCreate(BaseModel):
    recipient_id: UUID
    message: str

class MessageRead(BaseModel):
    id: UUID
    sender_id: UserResponse
    recipient_id: UserResponse
    content: str
    timestamp: datetime
    class Config:
        from_attributes = True
