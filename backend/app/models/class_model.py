from sqlalchemy import Column, Integer, String, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
from app.models.department import Department, Course

class ClassModel(Base):
    __tablename__ = "classes"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=False)
    course_id = Column(Integer, ForeignKey("courses.id"), nullable=True)
    academic_year = Column(String, nullable=False)
    semester = Column(String, nullable=False)
    teacher_ids = Column(JSON, default=[])
    is_timetable_published = Column(Boolean, default=False)

    department = relationship(Department)
    course = relationship(Course)
    subjects = relationship("SubjectModel", back_populates="academic_class", cascade="all, delete-orphan")
    students = relationship("User", back_populates="academic_class")
    timetable = relationship("TimetableEntry", back_populates="academic_class", cascade="all, delete-orphan")
    exam_timetable = relationship("ExamTimetableEntry", back_populates="academic_class", cascade="all, delete-orphan")


