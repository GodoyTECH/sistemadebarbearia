import os
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User
from app.models.profile import Profile
from app.models.shop import Shop
from app.api.auth import router as auth_router
from app.api.profile import router as profile_router
from app.api.services import router as services_router
from app.api.appointments import router as appointments_router
from app.api.stats import router as stats_router
from app.api.uploads import router as uploads_router

app = FastAPI(title="Luxe API")

origins = [origin.strip() for origin in settings.allowed_origins.split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(profile_router)
app.include_router(services_router)
app.include_router(appointments_router)
app.include_router(stats_router)
app.include_router(uploads_router)

os.makedirs(settings.upload_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.on_event("startup")
def ensure_seed_data():
    db: Session = SessionLocal()
    try:
        # Compatibilidade retroativa: admin opcional antigo
        if settings.admin_email and settings.admin_password:
            user = db.query(User).filter(User.email == settings.admin_email).first()
            if not user:
                user = User(
                    email=settings.admin_email,
                    first_name="Admin",
                    last_name="",
                    hashed_password=get_password_hash(settings.admin_password),
                )
                db.add(user)
                db.commit()

        if not settings.seed_bootstrap_enabled:
            return

        # 1) Garante usuário admin
        admin = db.query(User).filter(User.email == settings.seed_admin_email).first()
        if not admin:
            admin = User(
                email=settings.seed_admin_email,
                first_name=settings.seed_admin_first_name,
                last_name=settings.seed_admin_last_name,
                hashed_password=get_password_hash(settings.seed_admin_password),
            )
            db.add(admin)
            db.flush()

        # 2) Garante loja de teste
        shop = db.query(Shop).filter(Shop.code == settings.seed_shop_code).first()
        if not shop:
            shop = Shop(
                name=settings.seed_shop_name,
                code=settings.seed_shop_code,
                manager_user_id=admin.id,
            )
            db.add(shop)
            db.flush()

        # 3) Garante perfil manager do admin
        admin_profile = db.query(Profile).filter(Profile.user_id == admin.id).first()
        if not admin_profile:
            admin_profile = Profile(
                user_id=admin.id,
                shop_id=shop.id,
                role="manager",
                approval_status="active",
                availability=True,
                is_verified=True,
            )
            db.add(admin_profile)
        else:
            admin_profile.shop_id = shop.id
            admin_profile.role = "manager"
            admin_profile.approval_status = "active"

        # 4) Garante profissional de teste
        professional = db.query(User).filter(User.email == settings.seed_prof_email).first()
        if not professional:
            professional = User(
                email=settings.seed_prof_email,
                first_name=settings.seed_prof_first_name,
                last_name=settings.seed_prof_last_name,
                hashed_password=get_password_hash(settings.seed_prof_password),
            )
            db.add(professional)
            db.flush()

        professional_profile = db.query(Profile).filter(Profile.user_id == professional.id).first()
        if not professional_profile:
            professional_profile = Profile(
                user_id=professional.id,
                shop_id=shop.id,
                role="professional",
                approval_status="active",
                approved_by_user_id=admin.id,
                availability=True,
                is_verified=True,
            )
            db.add(professional_profile)
        else:
            professional_profile.shop_id = shop.id
            professional_profile.role = "professional"
            professional_profile.approval_status = "active"
            professional_profile.approved_by_user_id = admin.id

        db.commit()
    finally:
        db.close()


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/api/health")
def api_health():
    return {"status": "ok"}


@app.api_route("/api/login", methods=["GET", "POST"])
def legacy_login(response: Response):
    response.status_code = 307
    response.headers["Location"] = "/api/auth/login"
    return response


@app.api_route("/api/logout", methods=["GET", "POST"])
def legacy_logout(response: Response):
    response.status_code = 307
    response.headers["Location"] = "/api/auth/logout"
    return response
