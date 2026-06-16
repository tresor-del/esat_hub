from typing import Optional

from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime

from app.models.user import UserResponse
from app.models.media import MediaResponse


class MessageCreate(BaseModel):
    recipient_id: UUID
    message: str
    media_id: Optional[UUID] = None

class MessageRead(BaseModel):
    id: UUID
    sender_id: UserResponse
    recipient_id: UserResponse
    content: str
    timestamp: datetime
    model_config = ConfigDict(from_attributes=True)

class MessageResponse(BaseModel):
    id: UUID
    content: str
    sender_id: UUID
    recipient_id: UUID
    timestamp: datetime
    is_read: bool
    media: Optional[MediaResponse] = None 
    model_config = ConfigDict(from_attributes=True)
