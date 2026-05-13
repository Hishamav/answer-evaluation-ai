from sqlalchemy import Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Teacher(Base):
    __tablename__ = "teachers_registry"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    department_id = Column(Integer, ForeignKey("departments.id"), nullable=True)
    phone = Column(String, nullable=True)
    profile_image = Column(Text, nullable=True)

    department = relationship("Department")
    subjects = relationship("SubjectModel", back_populates="teacher")
    timetable_entries = relationship("TimetableEntry", back_populates="teacher")
