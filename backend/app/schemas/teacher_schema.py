from pydantic import BaseModel
from typing import Optional
from app.schemas.department import DepartmentResponse

class TeacherBase(BaseModel):
    name: str
    phone: Optional[str] = None
    profile_image: Optional[str] = None

class TeacherCreate(TeacherBase):
    department_id: Optional[int] = None

class TeacherResponse(TeacherBase):
    id: int
    department_id: Optional[int] = None
    department: Optional[DepartmentResponse] = None

    class Config:
        from_attributes = True
