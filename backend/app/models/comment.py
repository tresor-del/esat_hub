import datetime
import uuid
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.user import UserResponse
    from app.models import PostResponse

class CommentCreate(BaseModel):
    user_id: Optional[uuid.UUID] = None
    content: str
    post_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None

class CommentResponse(BaseModel):
    id: uuid.UUID
    content: str
    created_at: datetime.datetime
    edited_at: Optional[datetime.datetime] = None
    user: "UserResponse"
    post_id: uuid.UUID
    parent_id: Optional[uuid.UUID] = None
    replies: List["CommentResponse"] = []
    model_config = ConfigDict(from_attributes=True)


class CommentListResponse(BaseModel):
    total: int
    comments: List[CommentResponse]

class CommentStatsResponse(BaseModel):
    total_comments: int
    reply_count: int


from app.models.user import UserResponse
from app.models.post import PostResponse

CommentResponse.model_rebuild(_types_namespace={
    "UserResponse": UserResponse,
    "PostResponse": PostResponse
})