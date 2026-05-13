from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import secrets
import string
from typing import List
from app.database import SessionLocal
from app.models.user import User
from app.schemas.student_schema import StudentCreate, StudentResponse, StudentUpdate, StudentCredentialsResponse, BulkStudentCreate, BulkStudentResponse
from app.services.auth import get_password_hash

router = APIRouter(prefix="/students", tags=["Students"])

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def generate_password(length=12):
    characters = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(secrets.choice(characters) for i in range(length))

@router.get("/", response_model=List[StudentResponse])
def get_students(db: Session = Depends(get_db)):
    return db.query(User).filter(User.role == "student").all()

@router.post("/", response_model=StudentCredentialsResponse, status_code=status.HTTP_201_CREATED)
def create_student(student_data: StudentCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == student_data.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    if student_data.registration_id:
        reg_check = db.query(User).filter(User.registration_id == student_data.registration_id).first()
        if reg_check:
            raise HTTPException(status_code=400, detail=f"Registration ID '{student_data.registration_id}' is already in use")
    
    generated_password = generate_password()
    
    new_student = User(
        name=student_data.name,
        email=student_data.email,
        registration_id=student_data.registration_id,
        hashed_password=get_password_hash(generated_password),
        role="student",
        class_id=student_data.class_id,
        phone=student_data.phone,
        profile_image=student_data.profile_image,
        is_active=True
    )
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return StudentCredentialsResponse(student=new_student, password=generated_password)

@router.post("/bulk", response_model=BulkStudentResponse, status_code=status.HTTP_201_CREATED)
def bulk_create_students(bulk_data: BulkStudentCreate, db: Session = Depends(get_db)):
    results = []
    for student_data in bulk_data.students:
        db_user = db.query(User).filter(User.email == student_data.email).first()
        reg_check = None
        if student_data.registration_id:
            reg_check = db.query(User).filter(User.registration_id == student_data.registration_id).first()
            
        if db_user or reg_check:
            # Skip or handle error. For now, we'll skip existing emails/reg_ids to focus on successful creation
            continue
            
        generated_password = generate_password()
        
        new_student = User(
            name=student_data.name,
            email=student_data.email,
            registration_id=student_data.registration_id,
            hashed_password=get_password_hash(generated_password),
            role="student",
            class_id=student_data.class_id,
            phone=student_data.phone,
            profile_image=student_data.profile_image,
            is_active=True
        )
        db.add(new_student)
        db.commit()
        db.refresh(new_student)
        results.append(StudentCredentialsResponse(student=new_student, password=generated_password))
        
    return BulkStudentResponse(created_students=results)

@router.put("/{student_id}/status", response_model=StudentCredentialsResponse)
def toggle_student_status(student_id: int, status_update: StudentUpdate, db: Session = Depends(get_db)):
    db_student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db_student.is_active = status_update.is_active
    
    generated_password = ""
    if status_update.is_active:
        generated_password = generate_password()
        db_student.hashed_password = get_password_hash(generated_password)
        
    db.commit()
    db.refresh(db_student)
    
    return StudentCredentialsResponse(student=db_student, password=generated_password)

@router.put("/{student_id}", response_model=StudentResponse)
def update_student(student_id: int, student_data: StudentCreate, db: Session = Depends(get_db)):
    db_student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")

    if db_student.email != student_data.email:
        exist = db.query(User).filter(User.email == student_data.email).first()
        if exist:
            raise HTTPException(status_code=400, detail="Email already registered")

    if student_data.registration_id and db_student.registration_id != student_data.registration_id:
        reg_check = db.query(User).filter(User.registration_id == student_data.registration_id).first()
        if reg_check:
            raise HTTPException(status_code=400, detail="Registration ID already in use")

    db_student.name = student_data.name
    db_student.email = student_data.email
    db_student.registration_id = student_data.registration_id
    db_student.class_id = student_data.class_id
    db_student.phone = student_data.phone
    db_student.profile_image = student_data.profile_image

    
    db.commit()
    db.refresh(db_student)
    return db_student

@router.delete("/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db)):
    db_student = db.query(User).filter(User.id == student_id, User.role == "student").first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(db_student)
    db.commit()
    return {"message": "Student deleted"}
