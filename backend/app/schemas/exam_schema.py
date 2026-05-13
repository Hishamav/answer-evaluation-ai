from pydantic import BaseModel
from typing import Optional, List
from datetime import time, date
from app.schemas.subject_schema import SubjectResponse
from app.schemas.class_schema import ClassResponse

class ExamBase(BaseModel):
    title: str
    subject_id: int
    class_id: int
    exam_date: date
    start_time: time
    end_time: time
    room_number: Optional[str] = None
    total_marks: Optional[int] = 100
    status: Optional[str] = "scheduled"

class ExamCreate(ExamBase):
    pass

class ExamUpdate(BaseModel):
    title: Optional[str] = None
    subject_id: Optional[int] = None
    class_id: Optional[int] = None
    exam_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    room_number: Optional[str] = None
    total_marks: Optional[int] = None
    status: Optional[str] = None

class ExamResponse(ExamBase):
    id: int
    subject: Optional[SubjectResponse] = None
    academic_class: Optional[ClassResponse] = None

    class Config:
        from_attributes = True
