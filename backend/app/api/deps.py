from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import SessionLocal
from app.models.user import User
from app.models.profile import Profile


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user_id = decode_access_token(token)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def get_current_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> Profile | None:
    return db.query(Profile).filter(Profile.user_id == user.id).first()


def require_manager(profile: Profile | None = Depends(get_current_profile)) -> Profile:
    if not profile or profile.role != "manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")
    return profile


def require_active_professional(profile: Profile | None = Depends(get_current_profile)) -> Profile:
    if not profile or profile.role != "professional" or profile.approval_status != "active":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Aguardando aprovação para acessar o painel.")
    return profile
