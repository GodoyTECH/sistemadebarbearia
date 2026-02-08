from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user
from app.core.security import create_access_token, verify_password
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.models.user import User
from app.schemas.auth import LoginRequest
from app.schemas.user import UserBase

router = APIRouter(prefix="/api/auth", tags=["auth"])
rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


@router.post("/login", response_model=UserBase)
def login(payload: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    rate_limiter.hit(f"login:{request.client.host}")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.env == "production",
        max_age=60 * 60 * 24,
    )
    return UserBase(
        id=user.id,
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        profileImageUrl=user.profile_image_url,
    )


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}


@router.get("/user", response_model=UserBase)
def get_user(user: User = Depends(get_current_user)):
    return UserBase(
        id=user.id,
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        profileImageUrl=user.profile_image_url,
    )
