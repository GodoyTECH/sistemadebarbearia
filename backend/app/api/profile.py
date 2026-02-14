from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_profile
from app.models.profile import Profile
from app.models.shop import Shop
from app.schemas.profile import ProfileBase, ProfileUpsert
from app.schemas.user import UserBase
from app.schemas.shop import ShopBase
from app.models.user import User

router = APIRouter(tags=["profile"])


def to_profile_base(profile: Profile) -> ProfileBase:
    return ProfileBase(
        id=profile.id,
        userId=profile.user_id,
        shopId=profile.shop_id,
        role=profile.role,
        cpf=profile.cpf,
        phone=profile.phone,
        isVerified=profile.is_verified,
        approvalStatus=profile.approval_status,
        approvedByUserId=profile.approved_by_user_id,
        approvalAt=profile.approval_at.isoformat() if profile.approval_at else None,
        rejectionAt=profile.rejection_at.isoformat() if profile.rejection_at else None,
        availability=profile.availability,
    )


@router.get("/api/me")
def get_me(user: User = Depends(get_current_user), profile: Profile | None = Depends(get_current_profile), db: Session = Depends(get_db)):
    shop = None
    if profile and profile.shop_id:
        db_shop = db.query(Shop).filter(Shop.id == profile.shop_id).first()
        if db_shop:
            shop = ShopBase(id=db_shop.id, name=db_shop.name, code=db_shop.code, managerUserId=db_shop.manager_user_id)

    return {
        "user": UserBase(id=user.id, email=user.email, firstName=user.first_name, lastName=user.last_name, profileImageUrl=user.profile_image_url),
        "profile": to_profile_base(profile) if profile else None,
        "shop": shop,
    }


@router.post("/api/profile", response_model=ProfileBase)
def upsert_profile(payload: ProfileUpsert, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if profile:
        profile.role = payload.role
        profile.cpf = payload.cpf
        profile.phone = payload.phone
    else:
        profile = Profile(user_id=user.id, role=payload.role, cpf=payload.cpf, phone=payload.phone, is_verified=False)
        db.add(profile)
    db.commit()
    db.refresh(profile)
    return to_profile_base(profile)
