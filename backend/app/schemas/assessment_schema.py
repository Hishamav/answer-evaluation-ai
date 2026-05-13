from pydantic import BaseModel
from typing import Optional, List
from datetime import date, time


# ─── Assessment Schemas ───────────────────────────────────────────────────────

class AssessmentCreate(BaseModel):
    title: str
    course_ids: List[int] = []
    class_ids: List[int] = []
    start_date: date
    end_date: date
    is_published: bool = False


class AssessmentResponse(BaseModel):
    id: int
    title: str
    course_ids: List[int] = []
    class_ids: List[int] = []
    start_date: date
    end_date: date
    is_published: bool

    class Config:
        from_attributes = True


# ─── Timetable Entry Schemas ──────────────────────────────────────────────────

class TimetableEntryCreate(BaseModel):
    assessment_id: int
    class_id: int
    subject_id: int
    exam_date: date
    start_time: str   # "HH:MM"
    end_time: str     # "HH:MM"
    total_marks: int = 100


class TimetableEntryUpdate(BaseModel):
    exam_date: date
    start_time: str
    end_time: str
    total_marks: int


class TimetableEntryResponse(BaseModel):
    id: int
    assessment_id: int
    class_id: int
    subject_id: int
    exam_date: date
    start_time: str
    end_time: str
    total_marks: int

    # Nested info
    subject_name: Optional[str] = None
    class_name: Optional[str] = None

    class Config:
        from_attributes = True


class BulkTimetableCreate(BaseModel):
    entries: List[TimetableEntryCreate]
