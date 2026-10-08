from sqlalchemy.orm import Session
import bcrypt
from app.models.user import User
from app.schemas.auth import UserCreate

def get_password_hash(password: str) -> str:
    # Bcrypt has a 72-byte limit on passwords.
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        plain_bytes = plain_password.encode('utf-8')
        if len(plain_bytes) > 72:
            plain_bytes = plain_bytes[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(plain_bytes, hashed_bytes)
    except Exception:
        return False

def create_user(db: Session, user: UserCreate):
    db_user = User(
        email=user.email,
        hashed_password=get_password_hash(user.password),
        name=user.name
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        return None
    if not verify_password(password, user.hashed_password):
        return None
    if hasattr(user, 'is_active') and user.is_active is False:
        return None
    return user
