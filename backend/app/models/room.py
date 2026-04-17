from uuid import UUID

from pydantic import BaseModel


class RoomResponse(BaseModel):
    id: UUID
    name: str
    users: list
    rep_id: UUID
    posts: list