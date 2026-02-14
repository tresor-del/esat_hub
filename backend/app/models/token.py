from pydantic import BaseModel
from uuid import UUID

class TokenData(BaseModel):
    user_id: UUID

class Token(BaseModel):
    access_token: str
    token_type: str