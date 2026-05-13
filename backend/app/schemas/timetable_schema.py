from pydantic import BaseModel
from typing import Optional, List

class TimetableBase(BaseModel):
    class_id: int
    day_of_week: str
    start_time: str
    end_time: str
    subject_id: Optional[int] = None
    teacher_id: Optional[int] = None
    is_break: bool = False
    label: Optional[str] = None

class TimetableCreate(TimetableBase):
    pass

class TimetableEntryResponse(TimetableBase):
    id: int
    
    class Config:
        from_attributes = True

class TeacherSimple(BaseModel):
    id: int
    name: str

class SubjectSimple(BaseModel):
    id: int
    name: str

class ClassSimple(BaseModel):
    id: int
    name: str

class TimetableDetailResponse(TimetableEntryResponse):
    subject: Optional[SubjectSimple] = None
    teacher: Optional[TeacherSimple] = None
    academic_class: ClassSimple
