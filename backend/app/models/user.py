from pydantic import BaseModel, EmailStr, Field, ConfigDict

class UserBase(BaseModel):
    first_name: str
    last_name: str
    profil_name: str
    school_name: str
    domain: str
    level: str
    email: EmailStr
    is_verified: bool

    model_config = ConfigDict(from_attributes=True)

class UserCreate(UserBase):
    password: str = Field(min_length=6)

class UserInDatabase(UserBase):
    hashed_password: str
    username: str

class UserResponse(UserBase):
    id: str
