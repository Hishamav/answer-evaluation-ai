from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import SessionLocal
from app.models.department import Department, Course
from app.schemas.department import DepartmentCreate, DepartmentResponse

router = APIRouter(prefix="/departments", tags=["Departments"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).options(
        joinedload(Department.courses).joinedload(Course.specialization)
    ).all()

@router.post("/", response_model=DepartmentResponse, status_code=status.HTTP_201_CREATED)
def create_department(dept: DepartmentCreate, db: Session = Depends(get_db)):
    # Check for same name + year combo
    db_dept = db.query(Department).filter(Department.name == dept.name, Department.year == dept.year).first()
    if db_dept:
        raise HTTPException(status_code=400, detail="Department already exists for this year")
    
    # Fetch linked courses
    courses = db.query(Course).filter(Course.id.in_(dept.course_ids)).all()
    if not courses and dept.course_ids:
        raise HTTPException(status_code=400, detail="Invalid courses provided")
    
    new_dept = Department(name=dept.name, year=dept.year, description=dept.description)
    new_dept.courses = courses
    db.add(new_dept)
    db.commit()
    db.refresh(new_dept)
    return new_dept

@router.put("/{dept_id}", response_model=DepartmentResponse)
def update_department(dept_id: int, dept_update: DepartmentCreate, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    # Update base fields
    db_dept.name = dept_update.name
    db_dept.year = dept_update.year
    db_dept.description = dept_update.description
    
    # Update linked courses
    courses = db.query(Course).filter(Course.id.in_(dept_update.course_ids)).all()
    db_dept.courses = courses
    
    db.commit()
    db.refresh(db_dept)
    return db_dept

@router.delete("/{dept_id}")
def delete_department(dept_id: int, db: Session = Depends(get_db)):
    db_dept = db.query(Department).filter(Department.id == dept_id).first()
    if not db_dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(db_dept)
    db.commit()
    return {"message": "Department deleted successfully"}
