from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database import get_db
from app.models.online_exam_model import QuestionPaper, Question, ExamSubmission, StudentAnswer
from app.models.assessment_model import ExamTimetableEntry
from app.schemas.online_exam_schema import QuestionPaperCreate, QuestionPaperResponse, ExamSubmissionCreate, ExamSubmissionResponse
from datetime import datetime

router = APIRouter(prefix="/online-exam", tags=["online-exam"])

@router.post("/question-paper", response_model=QuestionPaperResponse)
def create_question_paper(data: QuestionPaperCreate, db: Session = Depends(get_db)):
    # Check if exists
    db_paper = db.query(QuestionPaper).filter(QuestionPaper.exam_timetable_entry_id == data.exam_timetable_entry_id).first()
    if db_paper:
        # Update existing
        db_paper.instructions = data.instructions
        db_paper.total_marks = data.total_marks
        db_paper.duration_minutes = data.duration_minutes
        
        # Delete old questions
        db.query(Question).filter(Question.question_paper_id == db_paper.id).delete()
    else:
        db_paper = QuestionPaper(
            exam_timetable_entry_id=data.exam_timetable_entry_id,
            instructions=data.instructions,
            total_marks=data.total_marks,
            duration_minutes=data.duration_minutes
        )
        db.add(db_paper)
        db.flush()

    for q in data.questions:
        db_q = Question(
            question_paper_id=db_paper.id,
            text=q.text,
            type=q.type,
            options=q.options,
            correct_option_index=q.correct_option_index,
            marks=q.marks,
            order_index=q.order_index
        )
        db.add(db_q)
    
    db.commit()
    db.refresh(db_paper)
    return db_paper

@router.get("/question-paper/{exam_id}", response_model=QuestionPaperResponse)
def get_question_paper(exam_id: int, db: Session = Depends(get_db)):
    db_paper = db.query(QuestionPaper).filter(QuestionPaper.exam_timetable_entry_id == exam_id).first()
    if not db_paper:
        raise HTTPException(status_code=404, detail="Question paper not found for this exam")
    return db_paper

@router.post("/submit", response_model=ExamSubmissionResponse)
def submit_exam(data: ExamSubmissionCreate, student_id: int, db: Session = Depends(get_db)):
    # Check if already submitted
    existing = db.query(ExamSubmission).filter(
        ExamSubmission.student_id == student_id,
        ExamSubmission.exam_timetable_entry_id == data.exam_timetable_entry_id
    ).first()
    
    if existing and existing.is_submitted:
        raise HTTPException(status_code=400, detail="Exam already submitted")

    if not existing:
        existing = ExamSubmission(
            student_id=student_id,
            exam_timetable_entry_id=data.exam_timetable_entry_id,
            start_time=datetime.now(),
            is_submitted=True,
            end_time=datetime.now()
        )
        db.add(existing)
        db.flush()
    else:
        existing.is_submitted = True
        existing.end_time = datetime.now()

    # Clear old answers if any (in case of partial saves later)
    db.query(StudentAnswer).filter(StudentAnswer.submission_id == existing.id).delete()

    for ans in data.answers:
        db_ans = StudentAnswer(
            submission_id=existing.id,
            question_id=ans.question_id,
            answer_text=ans.answer_text,
            selected_option_index=ans.selected_option_index
        )
        db.add(db_ans)

    db.commit()
    db.refresh(existing)
    return existing

@router.get("/submission/{exam_id}/{student_id}", response_model=Optional[ExamSubmissionResponse])
def get_submission(exam_id: int, student_id: int, db: Session = Depends(get_db)):
    return db.query(ExamSubmission).filter(
        ExamSubmission.exam_timetable_entry_id == exam_id,
        ExamSubmission.student_id == student_id
    ).first()
