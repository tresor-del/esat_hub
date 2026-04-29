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

class RoomListResponse(BaseModel):
    total: int
    rooms: list[RoomResponse]

class RoomResponseAdmin(BaseModel):
    id: UUID
    name: str
    post_count: int
    member_count: int

class RoomStatsResponseAdmin(BaseModel):
    total_rooms: int
    rooms: list[RoomResponseAdmin]
