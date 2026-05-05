from pydantic import BaseModel, ConfigDict
from uuid import UUID

class RecentChatUserSchema(BaseModel):
    id: UUID
    profil_name: str
    avatar_path: str | None

class RecentChatSchema(BaseModel):
    user: RecentChatUserSchema
    last_message: str
    last_message_at: str
    unread_count: int

    model_config = ConfigDict(from_attributes=True)