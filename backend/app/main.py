import os
from fastapi import FastAPI, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.session import SessionLocal
from app.models.user import User
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
def ensure_admin():
    if not settings.admin_email or not settings.admin_password:
        return
    db: Session = SessionLocal()
    try:
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
