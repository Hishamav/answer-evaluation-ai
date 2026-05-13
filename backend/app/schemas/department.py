from pydantic import BaseModel
from typing import Optional, List

# Specialization Schemas
class SpecializationBase(BaseModel):
    name: str
    description: Optional[str] = None

class SpecializationCreate(SpecializationBase):
    pass

class SpecializationResponse(SpecializationBase):
    id: int

    class Config:
        from_attributes = True

# Basic Course Schemas
class CourseBase(BaseModel):
    name: str
    description: Optional[str] = None

class CourseCreate(CourseBase):
    specialization_id: Optional[int] = None

class CourseResponse(CourseBase):
    id: int
    specialization_id: Optional[int] = None
    specialization: Optional[SpecializationResponse] = None

    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    year: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    course_ids: List[int] = []

class DepartmentResponse(DepartmentBase):
    id: int
    courses: List[CourseResponse] = []

    class Config:
        from_attributes = True
