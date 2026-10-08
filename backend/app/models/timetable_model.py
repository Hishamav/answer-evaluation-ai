from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Time
from sqlalchemy.orm import relationship
from app.database import Base

class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id = Column(Integer, primary_key=True, index=True)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    day_of_week = Column(String, nullable=False) # Monday, Tuesday, etc.
    start_time = Column(String, nullable=False) # Store as string for easier HH:mm management in UI
    end_time = Column(String, nullable=False)
    
    subject_id = Column(Integer, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    teacher_id = Column(Integer, ForeignKey("teachers_registry.id", ondelete="SET NULL"), nullable=True)
    
    is_break = Column(Boolean, default=False)
    label = Column(String, nullable=True) # e.g., "Lunch Break"

    # Relationships
    academic_class = relationship("ClassModel", back_populates="timetable")
    subject = relationship("SubjectModel", back_populates="timetable_entries")
    teacher = relationship("Teacher", back_populates="timetable_entries")
