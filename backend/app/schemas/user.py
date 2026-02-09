from pydantic import BaseModel, EmailStr, Field

class UserCreate(BaseModel):
    username: EmailStr
    password: str = Field(min_length=6)

class UserResponse(BaseModel):
    id: str
    username: EmailStr
    is_verified: bool

    class Config:
        from_attributes = True