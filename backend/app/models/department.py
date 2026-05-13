from sqlalchemy import Column, Integer, String, Text, Table, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

# Association table for Many-to-Many relationship between Department and Course
department_courses = Table(
    "department_courses",
    Base.metadata,
    Column("department_id", Integer, ForeignKey("departments.id"), primary_key=True),
    Column("course_id", Integer, ForeignKey("courses.id"), primary_key=True)
)

class Specialization(Base):
    __tablename__ = "specializations"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)

    courses = relationship("Course", back_populates="specialization")

class Course(Base):
    __tablename__ = "courses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    description = Column(Text, nullable=True)
    specialization_id = Column(Integer, ForeignKey("specializations.id"), nullable=True)

    specialization = relationship("Specialization", back_populates="courses")
    departments = relationship("Department", secondary=department_courses, back_populates="courses")

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    year = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    courses = relationship("Course", secondary=department_courses, back_populates="departments")
