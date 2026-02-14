import re
import secrets
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session

from app.api.deps import get_db, get_current_user, get_current_profile, require_manager
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.models.user import User
from app.models.shop import Shop
from app.models.profile import Profile
from app.models.professional_approval import ProfessionalApproval
from app.schemas.auth import LoginRequest, RegisterRequest, ProfessionalDecisionRequest
from app.schemas.user import UserBase
from app.schemas.shop import ShopBase

router = APIRouter(tags=["auth"])
rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


def ensure_luxe_email(email_or_prefix: str) -> str:
    value = email_or_prefix.strip().lower()
    if "@" not in value:
        value = f"{value}@luxe.com"
    return value


def validate_password(password: str):
    if len(password) < 8 or not re.match(r"^[A-Za-z0-9]+$", password):
        raise HTTPException(status_code=400, detail={"message": "Senha inválida. Use no mínimo 8 caracteres com apenas letras e números.", "field": "password"})


def generate_unique_shop_code(db: Session) -> str:
    for _ in range(20):
        code = f"LX-{secrets.token_hex(3).upper()}"
        exists = db.query(Shop).filter(Shop.code == code).first()
        if not exists:
            return code
    raise HTTPException(status_code=500, detail={"message": "Falha ao gerar código único da loja."})


@router.post("/api/auth/login", response_model=UserBase)
def login(payload: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    rate_limiter.hit(f"login:{request.client.host}")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail={"message": "Credenciais inválidas. Verifique e tente novamente."})

    profile = db.query(Profile).filter(Profile.user_id == user.id).first()
    if profile and profile.role == "professional":
        if profile.approval_status == "pending_approval":
            raise HTTPException(status_code=403, detail={"message": "Seu cadastro está pendente de aprovação do gerente."})
        if profile.approval_status == "rejected":
            raise HTTPException(status_code=403, detail={"message": "Seu cadastro foi recusado. Entre em contato com o gerente."})

    max_age = 60 * 60 * 24 * (7 if payload.keepConnected else 1)
    token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.env == "production",
        max_age=max_age,
    )
    return UserBase(id=user.id, email=user.email, firstName=user.first_name, lastName=user.last_name, profileImageUrl=user.profile_image_url)


@router.post("/api/auth/register", status_code=201)
def register(payload: RegisterRequest, response: Response, db: Session = Depends(get_db)):
    if payload.password != payload.confirmPassword:
        raise HTTPException(status_code=400, detail={"message": "A confirmação de senha deve ser igual à senha.", "field": "confirmPassword"})
    validate_password(payload.password)
    email = ensure_luxe_email(payload.emailPrefix)
    if not email.endswith("@luxe.com"):
        raise HTTPException(status_code=400, detail={"message": "Use um e-mail com domínio @luxe.com.", "field": "email"})
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=409, detail={"message": "E-mail já cadastrado.", "field": "email"})

    if payload.role == "manager":
        parts = payload.managerName.strip().split()
        user = User(email=email, first_name=parts[0], last_name=" ".join(parts[1:]) or None, hashed_password=get_password_hash(payload.password))
        db.add(user)
        db.flush()

        shop = Shop(name=payload.shopName.strip(), code=generate_unique_shop_code(db), manager_user_id=user.id)
        db.add(shop)
        db.flush()

        profile = Profile(
            user_id=user.id,
            shop_id=shop.id,
            role="manager",
            phone=payload.phone,
            approval_status="active",
            approval_at=datetime.utcnow(),
        )
        db.add(profile)
        db.commit()
        token = create_access_token(user.id)
        response.set_cookie(key="access_token", value=token, httponly=True, samesite="lax", secure=settings.env == "production", max_age=60 * 60 * 24 * 7)
        return {
            "user": UserBase(id=user.id, email=user.email, firstName=user.first_name, lastName=user.last_name, profileImageUrl=user.profile_image_url),
            "profile": {
                "id": profile.id,
                "userId": profile.user_id,
                "shopId": profile.shop_id,
                "role": profile.role,
                "phone": profile.phone,
                "isVerified": profile.is_verified,
                "approvalStatus": profile.approval_status,
                "approvedByUserId": profile.approved_by_user_id,
                "approvalAt": profile.approval_at.isoformat() if profile.approval_at else None,
                "rejectionAt": None,
                "availability": profile.availability,
            },
            "shop": ShopBase(id=shop.id, name=shop.name, code=shop.code, managerUserId=shop.manager_user_id),
        }

    shop = db.query(Shop).filter(Shop.code == payload.shopCode.strip().upper()).first()
    if not shop:
        raise HTTPException(status_code=404, detail={"message": "ID da loja não encontrado.", "field": "shopCode"})
    parts = payload.name.strip().split()
    user = User(email=email, first_name=parts[0], last_name=" ".join(parts[1:]) or None, hashed_password=get_password_hash(payload.password))
    db.add(user)
    db.flush()

    profile = Profile(user_id=user.id, shop_id=shop.id, role="professional", phone=payload.phone, approval_status="pending_approval")
    db.add(profile)
    db.commit()
    return {
        "user": UserBase(id=user.id, email=user.email, firstName=user.first_name, lastName=user.last_name, profileImageUrl=user.profile_image_url),
        "profile": {
            "id": profile.id,
            "userId": profile.user_id,
            "shopId": profile.shop_id,
            "role": profile.role,
            "phone": profile.phone,
            "isVerified": profile.is_verified,
            "approvalStatus": profile.approval_status,
            "approvedByUserId": None,
            "approvalAt": None,
            "rejectionAt": None,
            "availability": profile.availability,
        },
        "shop": ShopBase(id=shop.id, name=shop.name, code=shop.code, managerUserId=shop.manager_user_id),
        "message": "Cadastro realizado. Aguarde aprovação do gerente.",
    }


@router.post("/api/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token")
    return {"ok": True}


@router.get("/api/auth/user", response_model=UserBase)
def get_user(user: User = Depends(get_current_user)):
    return UserBase(id=user.id, email=user.email, firstName=user.first_name, lastName=user.last_name, profileImageUrl=user.profile_image_url)


@router.get("/api/professionals/pending")
def list_pending_professionals(manager_profile: Profile = Depends(require_manager), db: Session = Depends(get_db)):
    pending = (
        db.query(Profile, User)
        .join(User, User.id == Profile.user_id)
        .filter(Profile.shop_id == manager_profile.shop_id, Profile.role == "professional", Profile.approval_status == "pending_approval")
        .all()
    )
    return [{"userId": profile.user_id, "name": f"{user.first_name or ''} {user.last_name or ''}".strip(), "email": user.email, "phone": profile.phone} for profile, user in pending]


@router.post("/api/professionals/{professional_user_id}/decision")
def decide_professional(
    professional_user_id: str,
    payload: ProfessionalDecisionRequest,
    manager_user: User = Depends(get_current_user),
    manager_profile: Profile = Depends(require_manager),
    db: Session = Depends(get_db),
):
    target = db.query(Profile).filter(Profile.user_id == professional_user_id).first()
    if not target or target.role != "professional":
        raise HTTPException(status_code=404, detail={"message": "Profissional não encontrado."})
    if target.shop_id != manager_profile.shop_id:
        raise HTTPException(status_code=403, detail={"message": "Este profissional não pertence a esta loja."})

    now = datetime.utcnow()
    if payload.action == "approve":
        target.approval_status = "active"
        target.approved_by_user_id = manager_user.id
        target.approval_at = now
        target.rejection_at = None
        message = "Profissional aprovado com sucesso."
    else:
        target.approval_status = "rejected"
        target.approved_by_user_id = manager_user.id
        target.rejection_at = now
        target.approval_at = None
        message = "Profissional recusado."

    db.add(ProfessionalApproval(professional_user_id=professional_user_id, manager_user_id=manager_user.id, action=payload.action))
    db.commit()
    return {"profile": {"userId": target.user_id, "approvalStatus": target.approval_status}, "message": message}
