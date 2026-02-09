from fastapi import APIRouter, Depends, HTTPException, Response, Request
from sqlalchemy.orm import Session

import secrets

from app.api.deps import get_db, get_current_user
from app.core.security import create_access_token, verify_password, get_password_hash
from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.models.user import User
from app.models.profile import Profile
from app.models.store import Store
from app.models.audit_log import AuditLog
from app.schemas.auth import LoginRequest, RegisterRequest
from app.schemas.user import UserBase
from app.services.whatsapp import get_whatsapp_service, WhatsAppMessage

router = APIRouter(prefix="/api/auth", tags=["auth"])
rate_limiter = RateLimiter(max_requests=10, window_seconds=60)


def generate_store_number(db: Session) -> str:
    while True:
        store_number = f"{secrets.randbelow(90000000) + 10000000}"
        exists = db.query(Store).filter(Store.store_number == store_number).first()
        if not exists:
            return store_number


@router.post("/register", response_model=UserBase, status_code=201)
def register(payload: RegisterRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    rate_limiter.hit(f"register:{request.client.host}")
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email já cadastrado")

    if payload.role not in {"manager", "professional"}:
        raise HTTPException(status_code=422, detail="Tipo de conta inválido")

    store_id = None
    store = None
    if payload.role == "manager":
        if not payload.storeName:
            raise HTTPException(status_code=422, detail="Nome da loja é obrigatório")
        store_number = generate_store_number(db)
        store = Store(store_number=store_number, store_name=payload.storeName)
        db.add(store)
        db.flush()
        store_id = store.id
    else:
        if not payload.storeNumber:
            raise HTTPException(status_code=422, detail="Número da loja é obrigatório")
        store = db.query(Store).filter(Store.store_number == payload.storeNumber).first()
        if not store:
            raise HTTPException(status_code=404, detail="Você não faz parte desta filial/loja. Verifique o número da loja.")
        store_id = store.id

    user = User(
        email=payload.email,
        first_name=payload.firstName,
        last_name=payload.lastName,
        phone=payload.phone,
        role=payload.role,
        store_id=store_id,
        hashed_password=get_password_hash(payload.password),
    )
    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id,
        store_id=store_id,
        role=payload.role,
        phone=payload.phone,
        is_verified=False,
    )
    db.add(profile)

    db.add(AuditLog(actor_id=user.id, store_id=store_id, action="register", metadata=payload.role))
    db.commit()

    token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.env == "production",
    )

    if store:
        message = WhatsAppMessage(
            phone=payload.phone,
            content=(
                f"Olá {payload.firstName}! Cadastro confirmado.\n"
                f"Conta: {payload.role}\n"
                f"Loja: {store.store_name}\n"
                f"Número da loja: {store.store_number}\n"
                f"Email: {payload.email}\n"
                f"Para segurança, não enviamos sua senha por aqui."
            ),
        )
        get_whatsapp_service().send_message(message)

    return UserBase(
        id=user.id,
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        role=user.role,
        storeId=user.store_id,
        profileImageUrl=user.profile_image_url,
    )


@router.post("/login", response_model=UserBase)
def login(payload: LoginRequest, response: Response, request: Request, db: Session = Depends(get_db)):
    rate_limiter.hit(f"login:{request.client.host}")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not user.hashed_password:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")
    if not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    if user.role == "professional":
        if not payload.storeNumber:
            raise HTTPException(status_code=422, detail="Número da loja é obrigatório")
        store = db.query(Store).filter(Store.id == user.store_id).first()
        if not store or store.store_number != payload.storeNumber:
            raise HTTPException(status_code=403, detail="Filial incorreta")

    max_age = 60 * 60 * 24 * 30 if payload.rememberMe else None
    token = create_access_token(user.id)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        samesite="lax",
        secure=settings.env == "production",
        max_age=max_age,
    )

    db.add(AuditLog(actor_id=user.id, store_id=user.store_id, action="login", metadata=request.client.host))
    db.commit()

    return UserBase(
        id=user.id,
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        phone=user.phone,
        role=user.role,
        storeId=user.store_id,
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
        phone=user.phone,
        role=user.role,
        storeId=user.store_id,
        profileImageUrl=user.profile_image_url,
    )
