from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import Optional
from enum import Enum

class PostType(str, Enum):
    PHOTO = "photo"
    DOCUMENT = "document"

class UserPublic(BaseModel):
    id: UUID
    username: str

    model_config = ConfigDict(from_attributes=True)


class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    post_type: PostType

    model_config = ConfigDict(from_attributes=True)

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class PostResponse(PostBase):
    id: int
    file_path: str
    file_name: str
    mime_type: Optional[str]
    created_at: datetime
    updated_at: datetime
    user: UserPublic

    model_config = ConfigDict(from_attributes=True)

class PostListResponse(BaseModel):
    total: int
    posts: list[PostResponse]