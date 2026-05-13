from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.exam_model import ExamModel
from app.schemas.exam_schema import ExamCreate, ExamResponse, ExamUpdate

router = APIRouter(prefix="/exams", tags=["Exams"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[ExamResponse])
def get_exams(db: Session = Depends(get_db)):
    return db.query(ExamModel).order_by(ExamModel.exam_date, ExamModel.start_time).all()

@router.post("/", response_model=ExamResponse, status_code=status.HTTP_201_CREATED)
def create_exam(exam_data: ExamCreate, db: Session = Depends(get_db)):
    new_exam = ExamModel(**exam_data.model_dump())
    db.add(new_exam)
    db.commit()
    db.refresh(new_exam)
    return new_exam

@router.put("/{exam_id}", response_model=ExamResponse)
def update_exam(exam_id: int, exam_data: ExamUpdate, db: Session = Depends(get_db)):
    db_exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam schedule not found")
    
    for field, value in exam_data.model_dump(exclude_unset=True).items():
        setattr(db_exam, field, value)
    
    db.commit()
    db.refresh(db_exam)
    return db_exam

@router.delete("/{exam_id}")
def delete_exam(exam_id: int, db: Session = Depends(get_db)):
    db_exam = db.query(ExamModel).filter(ExamModel.id == exam_id).first()
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam schedule not found")
    db.delete(db_exam)
    db.commit()
    return {"message": "Exam schedule deleted"}
