from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator


class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    keepConnected: bool | None = False


class ManagerRegisterRequest(BaseModel):
    role: Literal["manager"]
    managerName: str
    shopName: str
    phone: str
    emailPrefix: str
    password: str
    confirmPassword: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8 or not value.isalnum() or any(ch.isspace() for ch in value):
            raise ValueError("Senha inválida. Use no mínimo 8 caracteres com apenas letras e números.")
        return value


class ProfessionalRegisterRequest(BaseModel):
    role: Literal["professional"]
    name: str
    phone: str
    emailPrefix: str
    password: str
    confirmPassword: str
    shopCode: str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if len(value) < 8 or not value.isalnum() or any(ch.isspace() for ch in value):
            raise ValueError("Senha inválida. Use no mínimo 8 caracteres com apenas letras e números.")
        return value


RegisterRequest = ManagerRegisterRequest | ProfessionalRegisterRequest


class ProfessionalDecisionRequest(BaseModel):
    action: Literal["approve", "reject"]
