import datetime
import uuid
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.models.post import PostResponse
from app.models.room import RoomResponse
from app.models.user import UserResponse

class MediaBase(BaseModel):
    title: str
    description: Optional[str] = None
    file_path: Optional[str]
    file_name: Optional[str]
    mime_type: Optional[str]

class MediaCreate(MediaBase):
    user_id: uuid.UUID
    room_id: Optional[uuid.UUID] = None

class MediaUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    file_path: Optional[str]
    file_name: Optional[str]
    mime_type: Optional[str]

    model_config = ConfigDict(from_attributes=True)

class MediaResponse(MediaBase):
    id: uuid.UUID
    created_at: datetime.datetime
    updated_at: datetime.datetime
    user: UserResponse
    room: RoomResponse

    model_config = ConfigDict(from_attributes=True)

class MediaListResponse(BaseModel):
    total: int
    media: List[MediaResponse]

class MediaUpdateResponse(BaseModel):
    message: str
    media: MediaResponse