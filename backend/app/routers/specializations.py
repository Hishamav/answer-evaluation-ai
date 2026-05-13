from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import SessionLocal
from app.models.department import Specialization
from app.schemas.department import SpecializationCreate, SpecializationResponse

router = APIRouter(prefix="/specializations", tags=["Specializations"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@router.get("/", response_model=List[SpecializationResponse])
def get_specializations(db: Session = Depends(get_db)):
    return db.query(Specialization).all()

@router.post("/", response_model=SpecializationResponse, status_code=status.HTTP_201_CREATED)
def create_specialization(spec: SpecializationCreate, db: Session = Depends(get_db)):
    new_spec = Specialization(name=spec.name, description=spec.description)
    db.add(new_spec)
    db.commit()
    db.refresh(new_spec)
    return new_spec

@router.put("/{spec_id}", response_model=SpecializationResponse)
def update_specialization(spec_id: int, spec_update: SpecializationCreate, db: Session = Depends(get_db)):
    db_spec = db.query(Specialization).filter(Specialization.id == spec_id).first()
    if not db_spec:
        raise HTTPException(status_code=404, detail="Specialization not found")
    
    db_spec.name = spec_update.name
    db_spec.description = spec_update.description
    db.commit()
    db.refresh(db_spec)
    return db_spec

@router.delete("/{spec_id}")
def delete_specialization(spec_id: int, db: Session = Depends(get_db)):
    db_spec = db.query(Specialization).filter(Specialization.id == spec_id).first()
    if not db_spec:
        raise HTTPException(status_code=404, detail="Specialization not found")
    
    db.delete(db_spec)
    db.commit()
    return {"message": "Specialization deleted successfully"}
