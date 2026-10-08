from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.teacher import Teacher
from app.schemas.teacher_schema import TeacherCreate, TeacherResponse

router = APIRouter(prefix="/teachers", tags=["Teachers"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[TeacherResponse])
def get_teachers(db: Session = Depends(get_db)):
    return db.query(Teacher).all()

@router.post("/", response_model=TeacherResponse, status_code=status.HTTP_201_CREATED)
def create_teacher(teacher_data: TeacherCreate, db: Session = Depends(get_db)):
    new_teacher = Teacher(
        name=teacher_data.name,
        department_id=teacher_data.department_id,
        phone=teacher_data.phone,
        profile_image=teacher_data.profile_image
    )
    db.add(new_teacher)
    db.commit()
    db.refresh(new_teacher)
    return new_teacher

@router.put("/{teacher_id}", response_model=TeacherResponse)
def update_teacher(teacher_id: int, teacher_data: TeacherCreate, db: Session = Depends(get_db)):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    db_teacher.name = teacher_data.name
    db_teacher.department_id = teacher_data.department_id
    db_teacher.phone = teacher_data.phone
    db_teacher.profile_image = teacher_data.profile_image

    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.delete("/{teacher_id}")
def delete_teacher(teacher_id: int, db: Session = Depends(get_db)):
    db_teacher = db.query(Teacher).filter(Teacher.id == teacher_id).first()
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Clean up JSON teacher_ids in ClassModel
    from app.models.class_model import ClassModel
    classes = db.query(ClassModel).all()
    for cls in classes:
        if cls.teacher_ids and teacher_id in cls.teacher_ids:
            cls.teacher_ids = [tid for tid in cls.teacher_ids if tid != teacher_id]
    
    db.delete(db_teacher)
    db.commit()
    return {"status": "success", "message": "Teacher removed from registry"}
