from uuid import UUID

from pydantic import BaseModel, ConfigDict
from app.models.user import UserResponse
from app.models.post import PostResponse


class RoomResponse(BaseModel):
    id: UUID
    name: str
    users: list[UserResponse]
    posts: list[PostResponse]

    model_config = ConfigDict(from_attributes=True)