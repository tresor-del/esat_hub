from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from typing import Optional

class NotificationPayload(BaseModel):
    type: str
    message: str
    post_id: Optional[int] = None
    author: Optional[str] = None
    comment_id: Optional[UUID] = None
    content: Optional[str] = None
    created_at: Optional[datetime] = None