from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.result_model import Result
from pydantic import BaseModel
from typing import List, Optional
import datetime

router = APIRouter(prefix="/api/results", tags=["results"])

class ResultCreate(BaseModel):
    student_id: int
    subject_id: int
    class_id: int
    total_marks: float
    obtained_marks: float
    percentage: float
    evaluation_details: Optional[dict] = None
    teacher_comment: Optional[str] = None
    teacher_marks: Optional[float] = None
    principal_comment: Optional[str] = None
    principal_marks: Optional[float] = None
    is_published: Optional[bool] = False

@router.post("/")
def save_result(result: ResultCreate, db: Session = Depends(get_db)):
    db_result = Result(**result.dict())
    db.add(db_result)
    db.commit()
    db.refresh(db_result)
    return db_result

class ResultEvaluationUpdate(BaseModel):
    comment: str
    marks: float
    role: str # 'teacher' or 'principal'

@router.put("/{result_id}/evaluate")
def evaluate_result(result_id: int, eval_data: ResultEvaluationUpdate, db: Session = Depends(get_db)):
    db_result = db.query(Result).filter(Result.id == result_id).first()
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found")
    
    if eval_data.role == 'teacher':
        db_result.teacher_comment = eval_data.comment
        db_result.teacher_marks = eval_data.marks
        db_result.is_teacher_evaluated = True
    elif eval_data.role == 'principal':
        db_result.principal_comment = eval_data.comment
        db_result.principal_marks = eval_data.marks
        db_result.is_principal_evaluated = True
    else:
        raise HTTPException(status_code=400, detail="Invalid role for evaluation")
    
    db.commit()
    return {"message": f"{eval_data.role.capitalize()} evaluation updated"}

@router.put("/{result_id}/publish")
def publish_result(result_id: int, db: Session = Depends(get_db)):
    db_result = db.query(Result).filter(Result.id == result_id).first()
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found")
    db_result.is_published = True
    db.commit()
    return {"message": "Result published"}

from sqlalchemy.orm import Session, joinedload

@router.get("/")
def get_all_results(db: Session = Depends(get_db)):
    return db.query(Result).options(
        joinedload(Result.student),
        joinedload(Result.subject),
        joinedload(Result.academic_class)
    ).order_by(Result.created_at.desc()).all()

@router.get("/student/{student_id}")
def get_student_results(student_id: int, db: Session = Depends(get_db)):
    return db.query(Result).options(
        joinedload(Result.subject),
        joinedload(Result.academic_class)
    ).filter(Result.student_id == student_id, Result.is_published == True).all()

@router.get("/class/{class_id}/subject/{subject_id}")
def get_class_results(class_id: int, subject_id: int, db: Session = Depends(get_db)):
    return db.query(Result).options(
        joinedload(Result.student)
    ).filter(Result.class_id == class_id, Result.subject_id == subject_id).all()

@router.delete("/{result_id}")
def delete_result(result_id: int, db: Session = Depends(get_db)):
    db_result = db.query(Result).filter(Result.id == result_id).first()
    if not db_result:
        raise HTTPException(status_code=404, detail="Result not found")
    db.delete(db_result)
    db.commit()
    return {"message": "Result deleted successfully"}
