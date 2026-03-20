from uuid import UUID
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum

class UserPublic(BaseModel):
    id: UUID
    username: str

    class Config:
        from_attributes = True

class PostType(str, Enum):
    PHOTO = "photo"
    DOCUMENT = "document"

class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    post_type: PostType

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None

class PostResponse(PostBase):
    id: int
    file_path: str
    file_name: str
    mime_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    user: UserPublic
    
    class Config:
        from_attributes = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
        

class PostListResponse(BaseModel):
    total: int
    posts: list[PostResponse]