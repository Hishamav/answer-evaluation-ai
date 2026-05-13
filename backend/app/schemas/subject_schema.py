from pydantic import BaseModel
from typing import Optional
from app.schemas.class_schema import ClassResponse
from app.schemas.teacher_schema import TeacherResponse

class SubjectBase(BaseModel):
    name: str
    class_id: int
    teacher_id: int

class SubjectCreate(SubjectBase):
    pass

class SubjectUpdate(SubjectBase):
    pass

class SubjectResponse(SubjectBase):
    id: int
    academic_class: Optional[ClassResponse] = None
    teacher: Optional[TeacherResponse] = None

    class Config:
        from_attributes = True
