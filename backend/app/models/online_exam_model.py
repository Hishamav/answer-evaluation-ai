from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Boolean, Text
from sqlalchemy.orm import relationship
from app.database import Base

class QuestionPaper(Base):
    __tablename__ = "question_papers"

    id = Column(Integer, primary_key=True, index=True)
    exam_timetable_entry_id = Column(Integer, ForeignKey("exam_timetable_entries.id"), nullable=False, unique=True)
    instructions = Column(Text, nullable=True)
    total_marks = Column(Integer, default=100)
    duration_minutes = Column(Integer, default=60) # Backup duration if needed

    questions = relationship("Question", back_populates="question_paper", cascade="all, delete-orphan")
    exam_timetable_entry = relationship("ExamTimetableEntry")

class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True, index=True)
    question_paper_id = Column(Integer, ForeignKey("question_papers.id"), nullable=False)
    text = Column(Text, nullable=False)
    type = Column(String, default="subjective") # "mcq", "subjective"
    options = Column(JSON, nullable=True) # For MCQ: ["Option A", "Option B", ...]
    correct_option_index = Column(Integer, nullable=True) # For MCQ auto-grading
    marks = Column(Integer, default=1)
    order_index = Column(Integer, default=0)

    question_paper = relationship("QuestionPaper", back_populates="questions")

class ExamSubmission(Base):
    __tablename__ = "exam_submissions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exam_timetable_entry_id = Column(Integer, ForeignKey("exam_timetable_entries.id"), nullable=False)
    start_time = Column(DateTime, nullable=True)
    end_time = Column(DateTime, nullable=True)
    is_submitted = Column(Boolean, default=False)
    final_score = Column(Integer, nullable=True)

    answers = relationship("StudentAnswer", back_populates="submission", cascade="all, delete-orphan")
    student = relationship("User")
    exam_timetable_entry = relationship("ExamTimetableEntry")

class StudentAnswer(Base):
    __tablename__ = "student_answers"

    id = Column(Integer, primary_key=True, index=True)
    submission_id = Column(Integer, ForeignKey("exam_submissions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=True) # For subjective or selected MCQ option text
    selected_option_index = Column(Integer, nullable=True) # For MCQ
    is_correct = Column(Boolean, nullable=True) # For MCQ auto-grading

    submission = relationship("ExamSubmission", back_populates="answers")
    question = relationship("Question")
