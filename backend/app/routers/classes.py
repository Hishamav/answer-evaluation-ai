from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.class_model import ClassModel
from app.models.user import User
from app.schemas.class_schema import ClassCreate, ClassResponse

router = APIRouter(prefix="/classes", tags=["Classes"])

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[ClassResponse])
def get_classes(db: Session = Depends(get_db)):
    return db.query(ClassModel).all()

@router.get("/{class_id}", response_model=ClassResponse)
def get_class(class_id: int, db: Session = Depends(get_db)):
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    return db_class

@router.post("/", response_model=ClassResponse, status_code=status.HTTP_201_CREATED)
def create_class(class_data: ClassCreate, db: Session = Depends(get_db)):
    # Check if a class with same course, year and semester already exists
    existing_class = db.query(ClassModel).filter(
        ClassModel.course_id == class_data.course_id,
        ClassModel.academic_year == class_data.academic_year,
        ClassModel.semester == class_data.semester
    ).first()
    
    if existing_class:
        raise HTTPException(
            status_code=400, 
            detail=f"A class for this course, academic year and semester already exists ({existing_class.name})."
        )

    db_class = ClassModel(
        name=class_data.name,
        department_id=class_data.department_id,
        course_id=class_data.course_id,
        academic_year=class_data.academic_year,
        semester=class_data.semester,
        teacher_ids=class_data.teacher_ids,
        is_timetable_published=class_data.is_timetable_published
    )
    db.add(db_class)
    db.commit()
    db.refresh(db_class)
    return db_class

@router.put("/{class_id}", response_model=ClassResponse)
def update_class(class_id: int, class_update: ClassCreate, db: Session = Depends(get_db)):
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db_class.name = class_update.name
    db_class.department_id = class_update.department_id
    db_class.course_id = class_update.course_id
    db_class.academic_year = class_update.academic_year
    db_class.semester = class_update.semester
    db_class.teacher_ids = class_update.teacher_ids
    db_class.is_timetable_published = class_update.is_timetable_published
    
    db.commit()
    db.refresh(db_class)
    return db_class

@router.put("/{class_id}/publish", response_model=ClassResponse)
def toggle_timetable_publish(class_id: int, db: Session = Depends(get_db)):
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    db_class.is_timetable_published = not db_class.is_timetable_published
    db.commit()
    db.refresh(db_class)
    return db_class

@router.delete("/{class_id}")
def delete_class(class_id: int, db: Session = Depends(get_db)):
    db_class = db.query(ClassModel).filter(ClassModel.id == class_id).first()
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Nullify class_id for students in this class
    db.query(User).filter(User.class_id == class_id).update({User.class_id: None})
    
    db.delete(db_class)
    db.commit()
    return {"message": "Class deleted successfully"}
