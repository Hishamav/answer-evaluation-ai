from pydantic import BaseModel, EmailStr
from typing import Optional, List
from app.schemas.class_schema import ClassResponse

class StudentBase(BaseModel):
    name: str
    email: EmailStr
    registration_id: Optional[str] = None
    phone: Optional[str] = None
    profile_image: Optional[str] = None


class StudentCreate(StudentBase):
    class_id: int

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    registration_id: Optional[str] = None
    phone: Optional[str] = None
    class_id: Optional[int] = None
    is_active: Optional[bool] = None
    profile_image: Optional[str] = None


class StudentResponse(StudentBase):
    id: int
    role: str
    is_active: bool
    class_id: Optional[int] = None
    academic_class: Optional[ClassResponse] = None



    class Config:
        from_attributes = True

class StudentCredentialsResponse(BaseModel):
    student: StudentResponse
    password: str

class BulkStudentCreate(BaseModel):
    students: List[StudentCreate]

class BulkStudentResponse(BaseModel):
    created_students: List[StudentCredentialsResponse]
