import datetime
import uuid
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from app.models.post import PostResponse
from app.models.user import UserResponse

class CommentCreate(BaseModel):
    content: str
    user_id: Optional[uuid.UUID] = None  # Optional - will be set from current_user in endpoint
    post_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None

class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime.datetime
    edited_at: datetime.datetime
    user: UserResponse
    post: PostResponse
    model_config = ConfigDict(from_attributes=True)
    parent_id: Optional[uuid.UUID] = None
    replies: List["CommentResponse"] = []

CommentResponse.model_rebuild()

class CommentListResponse(BaseModel):
    total: int
    comments: List[CommentResponse]

class CommentStatsResponse(BaseModel):
    total_comments: int
    reply_count: int


