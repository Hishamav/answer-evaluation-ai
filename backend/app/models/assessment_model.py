from sqlalchemy import Column, Integer, String, Date, ForeignKey, JSON, Time, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Assessment(Base):
    __tablename__ = "assessments"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    course_ids = Column(JSON, default=[])   # list of course IDs
    class_ids = Column(JSON, default=[])    # list of class IDs (derived from courses)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    is_published = Column(Boolean, default=False)

    timetable_entries = relationship("ExamTimetableEntry", back_populates="assessment", cascade="all, delete-orphan")



class ExamTimetableEntry(Base):
    __tablename__ = "exam_timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    exam_date = Column(Date, nullable=False)
    start_time = Column(String, nullable=False)
    end_time = Column(String, nullable=False)
    total_marks = Column(Integer, default=100)

    assessment = relationship("Assessment", back_populates="timetable_entries")
    academic_class = relationship("ClassModel", back_populates="exam_timetable")

    subject = relationship("SubjectModel")
