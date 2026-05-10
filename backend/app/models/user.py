from datetime import datetime
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
    role: Optional[str] = None
    major: Optional[str] = None
    year: Optional[str] = None
    email: EmailStr
    user_room_id: Optional[uuid.UUID] = None
    phone_number: Optional[str] = None
    birthday: Optional[datetime] = None
    card_number: Optional[str] = None
    status: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    profil_name: Optional[str] = None
    school_name: Optional[str] = None
    domain: Optional[str] = None
    level: Optional[str] = None
    role: Optional[str] = None
    major: Optional[str] = None
    status: Optional[str] = None
    year: Optional[str] = None
    email: Optional[EmailStr] = None
    birthday: Optional[datetime] = None
    card_number: Optional[str] = None
    phone_number: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

class UserInDatabase(UserBase):
    hashed_password: str
    username: str
    user_room_id: Optional[uuid.UUID] =  None

class UserResponse(UserBase):
    id: uuid.UUID
    is_verified: Optional[bool] = False
    username: Optional[str] = None
    user_room_id: Optional[uuid.UUID] = None
    phone_number: Optional[str] = None
    birthday: Optional[datetime] = None
    card_number: Optional[str] = None
    status: Optional[str] = None
    avatar_path: Optional[str] = None

class UserListResponse(BaseModel):
    total: int
    users: list[UserResponse]

    model_config = ConfigDict(from_attributes=True)

class UserSearchResponse(BaseModel):
    query: str
    users: list[UserResponse]

    model_config = ConfigDict(from_attributes=True)