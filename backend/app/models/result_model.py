from sqlalchemy import Column, Integer, String, Float, ForeignKey, JSON, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import datetime

class Result(Base):
    __tablename__ = "results"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    total_marks = Column(Float, nullable=False)
    obtained_marks = Column(Float, nullable=False)
    percentage = Column(Float, nullable=False)
    evaluation_details = Column(JSON, nullable=True) # Full AI evaluation JSON
    teacher_comment = Column(String, nullable=True)
    teacher_marks = Column(Float, nullable=True)
    principal_comment = Column(String, nullable=True)
    principal_marks = Column(Float, nullable=True)
    is_teacher_evaluated = Column(Boolean, default=False)
    is_principal_evaluated = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    is_published = Column(Boolean, default=False)

    student = relationship("User")
    subject = relationship("SubjectModel")
    academic_class = relationship("ClassModel")
