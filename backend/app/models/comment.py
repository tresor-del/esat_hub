import datetime
import uuid
from pydantic import BaseModel, ConfigDict
from typing import List
from app.models.post import PostResponse
from app.models.user import UserResponse

class CommentCreate(BaseModel):
    content: str
    user_id: uuid.UUID
    post_id: int

class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime.datetime
    edited_at: datetime.datetime
    user: UserResponse
    post: PostResponse
    model_config = ConfigDict(from_attributes=True)

class CommentListResponse(BaseModel):
    total: int
    comments: List[CommentResponse]

