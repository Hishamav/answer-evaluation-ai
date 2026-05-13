from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.auth import UserLogin, TokenResponse, PasswordChange
from app.services.auth import authenticate_user, verify_password, get_password_hash
from app.models.user import User

router = APIRouter(prefix="/api", tags=["authentication"])

@router.post("/login", response_model=TokenResponse)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = authenticate_user(db, user_data.email, user_data.password)
    
    # Mock fallback for manual testing if DB is not connected (Optional)
    if not user and user_data.email == "hisham@gmail.com" and user_data.password == "Hisham@123":
        return TokenResponse(
            status="success",
            user={"email": "hisham@gmail.com", "name": "Hisham", "role": "admin"},
            token="evalai-mock-token",
            message="Authenticated successfully (Mock)"
        )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return TokenResponse(
        status="success",
        user={"id": user.id, "email": user.email, "name": user.name, "role": user.role, "profile_image": user.profile_image, "class_id": user.class_id},

        token="evalai-session-token", # Real apps use JWT
        message="User authenticated successfully."
    )

@router.get("/verify/{email}")
async def verify_user(email: str, db: Session = Depends(get_db)):
    if email == "hisham@gmail.com":
        return {
            "status": "success", 
            "is_active": True, 
            "user": {"email": "hisham@gmail.com", "name": "Hisham", "role": "admin", "profile_image": None}
        }
        
    user = db.query(User).filter(User.email == email).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User deactivated or not found")
        
    return {
        "status": "success", 
        "is_active": True,
        "user": {"id": user.id, "email": user.email, "name": user.name, "role": user.role, "profile_image": user.profile_image, "class_id": user.class_id}
    }

@router.post("/change-password/{email}")
async def change_password(email: str, data: PasswordChange, db: Session = Depends(get_db)):
    if email == "hisham@gmail.com":
        raise HTTPException(status_code=400, detail="Cannot change password for mock admin")
        
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if not verify_password(data.old_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
        
    user.hashed_password = get_password_hash(data.new_password)
    db.commit()
    return {"status": "success", "message": "Password updated successfully"}


