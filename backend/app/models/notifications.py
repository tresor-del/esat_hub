from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

from app.models.user import UserResponse

class NotificationResponse(BaseModel):
    type: str
    content: str
    is_read: bool
    recipient: UserResponse
    sender: Optional[UserResponse] = None
    post_id: Optional[int] = None
    comment_id: Optional[UUID] = None
    model_config = ConfigDict(from_attributes=True)

class NotificationResponseUser(BaseModel):
    id: UUID
    type: str
    content: str
    is_read: bool
    recipient: UserResponse
    sender: Optional[UserResponse] = None
    post_id: Optional[int] = None
    comment_id: Optional[UUID] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    total: int
    notifications: List[NotificationResponseUser]