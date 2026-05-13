from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class SubjectModel(Base):
    __tablename__ = "subjects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    class_id = Column(Integer, ForeignKey("classes.id"), nullable=False)
    teacher_id = Column(Integer, ForeignKey("teachers_registry.id"), nullable=False)

    academic_class = relationship("ClassModel", back_populates="subjects")
    teacher = relationship("Teacher", back_populates="subjects")
    timetable_entries = relationship("TimetableEntry", back_populates="subject")
