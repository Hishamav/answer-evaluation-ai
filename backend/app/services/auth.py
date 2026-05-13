from sqlalchemy.orm import Session
from passlib.context import CryptContext
from app.models.user import User
from app.schemas.auth import UserCreate

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    # Bcrypt has a 72-byte limit on passwords. We truncate to prevent errors.
    safe_pwd = password[:72] if len(password) > 72 else password
    return pwd_context.hash(safe_pwd)

def verify_password(plain_password: str, hashed_password: str):
    # Truncate input password to match original hashing logic
    safe_pwd = plain_password[:72] if len(plain_password) > 72 else plain_password
    return pwd_context.verify(safe_pwd, hashed_password)

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
