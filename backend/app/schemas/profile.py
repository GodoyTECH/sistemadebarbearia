from typing import Literal
from pydantic import BaseModel, ConfigDict, field_validator


class ProfileBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    userId: str
    role: Literal["admin", "professional"]
    cpf: str | None = None
    phone: str | None = None
    isVerified: bool


class ProfileUpsert(BaseModel):
    role: str
    cpf: str
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        digits = "".join(filter(str.isdigit, value))
        if len(digits) < 10:
            raise ValueError("Telefone inválido")
        return value
