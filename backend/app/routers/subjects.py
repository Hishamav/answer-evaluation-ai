from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.subject_model import SubjectModel
from app.schemas.subject_schema import SubjectCreate, SubjectResponse

router = APIRouter(prefix="/subjects", tags=["Subjects"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[SubjectResponse])
def get_subjects(db: Session = Depends(get_db)):
    return db.query(SubjectModel).all()

@router.post("/", response_model=SubjectResponse, status_code=status.HTTP_201_CREATED)
def create_subject(subject: SubjectCreate, db: Session = Depends(get_db)):
    new_subject = SubjectModel(
        name=subject.name, 
        class_id=subject.class_id,
        teacher_id=subject.teacher_id
    )
    db.add(new_subject)
    db.commit()
    db.refresh(new_subject)
    return new_subject

@router.put("/{subject_id}", response_model=SubjectResponse)
def update_subject(subject_id: int, subject_update: SubjectCreate, db: Session = Depends(get_db)):
    db_subject = db.query(SubjectModel).filter(SubjectModel.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db_subject.name = subject_update.name
    db_subject.class_id = subject_update.class_id
    db_subject.teacher_id = subject_update.teacher_id
    db.commit()
    db.refresh(db_subject)
    return db_subject

@router.delete("/{subject_id}")
def delete_subject(subject_id: int, db: Session = Depends(get_db)):
    db_subject = db.query(SubjectModel).filter(SubjectModel.id == subject_id).first()
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    db.delete(db_subject)
    db.commit()
    return {"message": "Subject deleted successfully"}
