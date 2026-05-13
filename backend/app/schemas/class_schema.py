from pydantic import BaseModel
from typing import Optional
from app.schemas.department import DepartmentResponse, CourseResponse

class ClassBase(BaseModel):
    name: str
    department_id: int
    course_id: Optional[int] = None
    academic_year: str
    semester: str
    teacher_ids: Optional[list[int]] = []
    is_timetable_published: bool = False

class ClassCreate(ClassBase):
    pass

class ClassResponse(ClassBase):
    id: int
    is_timetable_published: bool
    department: Optional[DepartmentResponse] = None
    course: Optional[CourseResponse] = None

    class Config:
        from_attributes = True
