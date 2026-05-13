from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.timetable_model import TimetableEntry
from app.schemas.timetable_schema import TimetableCreate, TimetableDetailResponse
from app.models.subject_model import SubjectModel

router = APIRouter(prefix="/timetable", tags=["Timetable"])

@router.get("/", response_model=List[TimetableDetailResponse])
def get_all_timetable_entries(db: Session = Depends(get_db)):
    return db.query(TimetableEntry).all()

@router.get("/class/{class_id}", response_model=List[TimetableDetailResponse])
def get_class_timetable(class_id: int, db: Session = Depends(get_db)):
    return db.query(TimetableEntry).filter(TimetableEntry.class_id == class_id).all()

@router.post("/", response_model=TimetableDetailResponse, status_code=status.HTTP_201_CREATED)
def create_timetable_entry(entry_data: TimetableCreate, db: Session = Depends(get_db)):
    # Basic validation: If not a break, subject and teacher must be provided
    if not entry_data.is_break:
        if not entry_data.subject_id:
            raise HTTPException(status_code=400, detail="Subject is required for non-break entries")
        
        # If teacher_id is not provided, try to get it from the subject's default teacher
        if not entry_data.teacher_id:
            subject = db.query(SubjectModel).filter(SubjectModel.id == entry_data.subject_id).first()
            if subject:
                entry_data.teacher_id = subject.teacher_id
            else:
                raise HTTPException(status_code=400, detail="Subject not found")

    new_entry = TimetableEntry(**entry_data.dict())
    db.add(new_entry)
    db.commit()
    db.refresh(new_entry)
    return new_entry

@router.put("/{entry_id}", response_model=TimetableDetailResponse)
def update_timetable_entry(entry_id: int, entry_data: TimetableCreate, db: Session = Depends(get_db)):
    db_entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    if not entry_data.is_break:
        if not entry_data.subject_id:
            raise HTTPException(status_code=400, detail="Subject is required")
        if not entry_data.teacher_id:
            subject = db.query(SubjectModel).filter(SubjectModel.id == entry_data.subject_id).first()
            if subject:
                entry_data.teacher_id = subject.teacher_id

    for key, value in entry_data.dict().items():
        setattr(db_entry, key, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@router.delete("/{entry_id}")
def delete_timetable_entry(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(TimetableEntry).filter(TimetableEntry.id == entry_id).first()
    if not db_entry:
        raise HTTPException(status_code=404, detail="Entry not found")
    
    db.delete(db_entry)
    db.commit()
    return {"message": "Timetable entry deleted successfully"}
