from datetime import datetime
from uuid import UUID
import uuid
from pydantic import BaseModel, ConfigDict
from typing import List, Optional

from app.models.user import UserResponse
from app.models.post import PostResponse

class NotificationUserResponse(BaseModel):
    id: uuid.UUID
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profil_name: Optional[str] = None
    avatar_path: Optional[str] = None
    user_room_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class NotificationResponse(BaseModel):
    type: Optional[str] = None
    title: Optional[str] = None
    content: Optional[str] = None
    is_read: bool
    recipient: NotificationUserResponse
    sender: Optional[NotificationUserResponse] = None
    post: Optional[PostResponse] = None
    comment_id: Optional[UUID] = None
    model_config = ConfigDict(from_attributes=True)

class NotificationResponseUser(BaseModel):
    id: UUID
    type: str
    content: str
    is_read: bool
    recipient: NotificationUserResponse
    sender: Optional[NotificationUserResponse] = None
    post: Optional[PostResponse] = None
    comment_id: Optional[UUID] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class NotificationListResponse(BaseModel):
    total: int
    notifications: List[NotificationResponseUser]