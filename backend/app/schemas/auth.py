from pydantic import BaseModel, EmailStr, Field
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr = Field(..., description="The institution email address")
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    role: Optional[str] = None
    profile_image: Optional[str] = None
    class_id: Optional[int] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=64)

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)

class UserResponse(UserBase):
    id: int
    status: str = "success"
    
    class Config:
        from_attributes = True

class PasswordChange(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8, max_length=64)

class TokenResponse(BaseModel):

    status: str = "success"
    user: UserBase
    token: str
    message: Optional[str] = None
