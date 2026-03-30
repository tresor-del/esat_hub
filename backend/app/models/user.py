import uuid

from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional


class UserBase(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profil_name: Optional[str] = None
    school_name: Optional[str] = None
    domain: Optional[str] = None
    level: Optional[str] = None
    email: EmailStr

    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserInDatabase(UserBase):
    hashed_password: str
    username: str
    is_verified: bool

class UserResponse(UserBase):
    id: uuid.UUID
    is_verified: Optional[bool] = False
    username: Optional[str] = None

class UserListResponse(BaseModel):
    total: int
    users: list[UserResponse]

    model_config = ConfigDict(from_attributes=True)
