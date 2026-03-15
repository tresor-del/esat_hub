from pydantic import BaseModel
from uuid import UUID

class RefreshToken(BaseModel):
    refresh_token: str

class TokenData(BaseModel):
    user_id: UUID

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str