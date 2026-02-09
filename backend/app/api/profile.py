from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_profile, get_current_store
from app.models.profile import Profile
from app.schemas.profile import ProfileBase, ProfileUpsert
from app.schemas.user import UserBase
from app.schemas.store import StoreBase
from app.models.user import User
from app.models.store import Store

router = APIRouter(tags=["profile"])


@router.get("/api/me")
def get_me(
    user: User = Depends(get_current_user),
    profile: Profile | None = Depends(get_current_profile),
    store: Store | None = Depends(get_current_store),
):
    return {
        "user": UserBase(
            id=user.id,
            email=user.email,
            firstName=user.first_name,
            lastName=user.last_name,
            phone=user.phone,
            role=user.role,
            storeId=user.store_id,
            profileImageUrl=user.profile_image_url,
        ),
        "profile": ProfileBase(
            id=profile.id,
            userId=profile.user_id,
            storeId=profile.store_id,
            role=profile.role,
            cpf=profile.cpf,
            phone=profile.phone,
            isVerified=profile.is_verified,
        ) if profile else None,
        "store": StoreBase(
            id=store.id,
            storeNumber=store.store_number,
            storeName=store.store_name,
        ) if store else None,
    }


@router.post("/api/profile", response_model=ProfileBase)
def upsert_profile(
    payload: ProfileUpsert,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    role = payload.role or user.role
    if profile:
        profile.role = role
        profile.cpf = payload.cpf
        profile.phone = payload.phone
    else:
        profile = Profile(
            user_id=user.id,
            store_id=user.store_id,
            role=role,
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
        storeId=profile.store_id,
        role=profile.role,
        cpf=profile.cpf,
        phone=profile.phone,
        isVerified=profile.is_verified,
    )
