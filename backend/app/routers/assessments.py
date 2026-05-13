from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from app.database import SessionLocal
from app.models.assessment_model import Assessment, ExamTimetableEntry
from app.schemas.assessment_schema import (
    AssessmentCreate, AssessmentResponse,
    TimetableEntryCreate, TimetableEntryResponse, BulkTimetableCreate, TimetableEntryUpdate
)

router = APIRouter(prefix="/assessments", tags=["Assessments"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ─── Assessments ──────────────────────────────────────────────────────────────

@router.get("/", response_model=List[AssessmentResponse])
def list_assessments(db: Session = Depends(get_db)):
    return db.query(Assessment).order_by(Assessment.id.desc()).all()


@router.post("/", response_model=AssessmentResponse, status_code=status.HTTP_201_CREATED)
def create_assessment(data: AssessmentCreate, db: Session = Depends(get_db)):
    assessment = Assessment(
        title=data.title,
        course_ids=data.course_ids,
        class_ids=data.class_ids,
        start_date=data.start_date,
        end_date=data.end_date,
        is_published=data.is_published,
    )
    db.add(assessment)
    db.commit()
    db.refresh(assessment)
    return assessment


@router.put("/{assessment_id}", response_model=AssessmentResponse)
def update_assessment(assessment_id: int, data: AssessmentCreate, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    
    a.title = data.title
    a.course_ids = data.course_ids
    a.class_ids = data.class_ids
    a.start_date = data.start_date
    a.end_date = data.end_date
    a.is_published = data.is_published
    
    db.commit()
    db.refresh(a)
    return a

@router.put("/{assessment_id}/publish", response_model=AssessmentResponse)
def toggle_publish_assessment(assessment_id: int, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    a.is_published = not a.is_published
    db.commit()
    db.refresh(a)
    return a


@router.delete("/{assessment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_assessment(assessment_id: int, db: Session = Depends(get_db)):
    a = db.query(Assessment).filter(Assessment.id == assessment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assessment not found")
    db.delete(a)
    db.commit()


# ─── Timetable Entries ────────────────────────────────────────────────────────

@router.get("/{assessment_id}/timetable", response_model=List[TimetableEntryResponse])
def get_timetable(assessment_id: int, db: Session = Depends(get_db)):
    entries = (
        db.query(ExamTimetableEntry)
        .options(
            joinedload(ExamTimetableEntry.subject),
            joinedload(ExamTimetableEntry.academic_class)
        )
        .filter(ExamTimetableEntry.assessment_id == assessment_id)
        .order_by(ExamTimetableEntry.exam_date, ExamTimetableEntry.start_time)
        .all()
    )
    result = []
    for e in entries:
        result.append(TimetableEntryResponse(
            id=e.id,
            assessment_id=e.assessment_id,
            class_id=e.class_id,
            subject_id=e.subject_id,
            exam_date=e.exam_date,
            start_time=e.start_time,
            end_time=e.end_time,
            total_marks=e.total_marks,
            subject_name=e.subject.name if e.subject else None,
            class_name=e.academic_class.name if e.academic_class else None,
        ))
    return result


@router.get("/timetable/{entry_id}", response_model=TimetableEntryResponse)
def get_timetable_entry(entry_id: int, db: Session = Depends(get_db)):
    e = (
        db.query(ExamTimetableEntry)
        .options(
            joinedload(ExamTimetableEntry.subject),
            joinedload(ExamTimetableEntry.academic_class)
        )
        .filter(ExamTimetableEntry.id == entry_id)
        .first()
    )
    if not e:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    return TimetableEntryResponse(
        id=e.id,
        assessment_id=e.assessment_id,
        class_id=e.class_id,
        subject_id=e.subject_id,
        exam_date=e.exam_date,
        start_time=e.start_time,
        end_time=e.end_time,
        total_marks=e.total_marks,
        subject_name=e.subject.name if e.subject else None,
        class_name=e.academic_class.name if e.academic_class else None,
    )


@router.post("/{assessment_id}/timetable", status_code=status.HTTP_201_CREATED)
def save_timetable(assessment_id: int, data: BulkTimetableCreate, db: Session = Depends(get_db)):
    if not data.entries:
        return {"message": "No entries provided", "count": 0}

    # Extract class IDs from the incoming entries to only replace those specific schedules
    class_ids = list(set(entry.class_id for entry in data.entries))

    # Replace existing entries for this assessment AND these specific classes
    db.query(ExamTimetableEntry).filter(
        ExamTimetableEntry.assessment_id == assessment_id,
        ExamTimetableEntry.class_id.in_(class_ids)
    ).delete(synchronize_session=False)

    for entry_data in data.entries:
        entry = ExamTimetableEntry(
            assessment_id=assessment_id,
            class_id=entry_data.class_id,
            subject_id=entry_data.subject_id,
            exam_date=entry_data.exam_date,
            start_time=entry_data.start_time,
            end_time=entry_data.end_time,
            total_marks=entry_data.total_marks,
        )
        db.add(entry)
    db.commit()
    return {"message": "Timetable saved successfully", "count": len(data.entries)}

@router.put("/timetable/{entry_id}", response_model=TimetableEntryResponse)
def update_timetable_entry(entry_id: int, data: TimetableEntryUpdate, db: Session = Depends(get_db)):
    e = db.query(ExamTimetableEntry).filter(ExamTimetableEntry.id == entry_id).first()
    if not e:
        raise HTTPException(status_code=404, detail="Timetable entry not found")
    
    e.exam_date = data.exam_date
    e.start_time = data.start_time
    e.end_time = data.end_time
    e.total_marks = data.total_marks
    
    db.commit()
    db.refresh(e)
    
    # We need to return TimetableEntryResponse, but e has relationships that might not be loaded
    # Refresh might load them if using lazy='joined' but here we manually build it like get_timetable
    return TimetableEntryResponse(
        id=e.id,
        assessment_id=e.assessment_id,
        class_id=e.class_id,
        subject_id=e.subject_id,
        exam_date=e.exam_date,
        start_time=e.start_time,
        end_time=e.end_time,
        total_marks=e.total_marks,
        subject_name=e.subject.name if e.subject else None,
        class_name=e.academic_class.name if e.academic_class else None,
    )
