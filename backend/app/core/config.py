from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    env: str = "local"
    secret_key: str = "change-me"
    access_token_expire_minutes: int = 60 * 24
    database_url: str = "postgresql+psycopg://postgres:postgres@localhost:5432/sistemadebarbearia"
    allowed_origins: str = "http://localhost:5173"
    upload_dir: str = "./backend/uploads"
    admin_email: str | None = None
    admin_password: str | None = None
    whatsapp_enabled: bool = False


settings = Settings()
