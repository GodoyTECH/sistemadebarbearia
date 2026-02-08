from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_profile
from app.models.profile import Profile
from app.schemas.profile import ProfileBase, ProfileUpsert
from app.schemas.user import UserBase
from app.models.user import User

router = APIRouter(tags=["profile"])


@router.get("/api/me")
def get_me(
    user: User = Depends(get_current_user),
    profile: Profile | None = Depends(get_current_profile),
):
    return {
        "user": UserBase(
            id=user.id,
            email=user.email,
            firstName=user.first_name,
            lastName=user.last_name,
            profileImageUrl=user.profile_image_url,
        ),
        "profile": ProfileBase(
            id=profile.id,
            userId=profile.user_id,
            role=profile.role,
            cpf=profile.cpf,
            phone=profile.phone,
            isVerified=profile.is_verified,
        ) if profile else None,
    }


@router.post("/api/profile", response_model=ProfileBase)
def upsert_profile(
    payload: ProfileUpsert,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if profile:
        profile.role = payload.role
        profile.cpf = payload.cpf
        profile.phone = payload.phone
    else:
        profile = Profile(
            user_id=user.id,
            role=payload.role,
            cpf=payload.cpf,
            phone=payload.phone,
            is_verified=False,
        )
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return ProfileBase(
        id=profile.id,
        userId=profile.user_id,
        role=profile.role,
        cpf=profile.cpf,
        phone=profile.phone,
        isVerified=profile.is_verified,
    )
