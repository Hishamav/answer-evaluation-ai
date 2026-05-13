from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Time, Date
from sqlalchemy.orm import relationship
from app.database import Base

class ExamModel(Base):
    __tablename__ = "exams"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    exam_date = Column(Date, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    room_number = Column(String, nullable=True)
    total_marks = Column(Integer, default=100)
    status = Column(String, default="scheduled") # scheduled, ongoing, completed, cancelled

    subject = relationship("SubjectModel")
    academic_class = relationship("ClassModel")
