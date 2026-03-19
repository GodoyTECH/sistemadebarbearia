from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


def normalize_database_url(url: str) -> str:
    """Force SQLAlchemy to use psycopg when URL comes without explicit driver."""
    if url.startswith("postgres://"):
        return "postgresql+psycopg://" + url[len("postgres://") :]

    if url.startswith("postgresql://"):
        return "postgresql+psycopg://" + url[len("postgresql://") :]

    return url


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    env: str = "local"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/sistemadebarbearia"
    allowed_origins: str = "http://localhost:5173"

    @field_validator("database_url", mode="before")
    @classmethod
    def _normalize_database_url(cls, value: str) -> str:
        if not isinstance(value, str):
            return value
        return normalize_database_url(value)
    upload_dir: str = "./backend/uploads"
    admin_email: str | None = None
    admin_password: str | None = None

    # Bootstrap seed (produção/local): cria usuários e loja de teste se não existirem
    seed_bootstrap_enabled: bool = True
    seed_admin_email: str = "admin@luxe.com"
    seed_admin_password: str = "AdminLuxe2026"
    seed_admin_first_name: str = "Admin"
    seed_admin_last_name: str = "Luxe"

    seed_shop_name: str = "Luxe Barbearia Teste"
    seed_shop_code: str = "LUXETEST01"

    seed_prof_email: str = "profissional@luxe.com"
    seed_prof_password: str = "ProfLuxe2026"
    seed_prof_first_name: str = "Profissional"
    seed_prof_last_name: str = "Teste"

    cloudinary_cloud_name: str | None = None
    cloudinary_api_key: str | None = None
    cloudinary_api_secret: str | None = None


settings = Settings()
