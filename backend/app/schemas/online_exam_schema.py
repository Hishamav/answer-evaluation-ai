from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime

class QuestionBase(BaseModel):
    text: str
    type: str = "subjective"
    options: Optional[List[str]] = None
    correct_option_index: Optional[int] = None
    marks: int = 1
    order_index: int = 0

class QuestionCreate(QuestionBase):
    pass

class QuestionResponse(QuestionBase):
    id: int
    question_paper_id: int
    class Config:
        from_attributes = True

class QuestionPaperBase(BaseModel):
    instructions: Optional[str] = None
    total_marks: int = 100
    duration_minutes: int = 60

class QuestionPaperCreate(QuestionPaperBase):
    exam_timetable_entry_id: int
    questions: List[QuestionCreate]

class QuestionPaperResponse(QuestionPaperBase):
    id: int
    exam_timetable_entry_id: int
    questions: List[QuestionResponse]
    class Config:
        from_attributes = True

class StudentAnswerBase(BaseModel):
    question_id: int
    answer_text: Optional[str] = None
    selected_option_index: Optional[int] = None

class ExamSubmissionCreate(BaseModel):
    exam_timetable_entry_id: int
    answers: List[StudentAnswerBase]

class ExamSubmissionResponse(BaseModel):
    id: int
    student_id: int
    exam_timetable_entry_id: int
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    is_submitted: bool
    final_score: Optional[int]
    class Config:
        from_attributes = True
