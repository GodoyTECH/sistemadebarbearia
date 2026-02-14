from typing import Literal
from pydantic import BaseModel, ConfigDict, field_validator


class ProfileBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    userId: str
    shopId: int | None = None
    role: Literal["manager", "professional"]
    cpf: str | None = None
    phone: str | None = None
    isVerified: bool
    approvalStatus: Literal["pending_approval", "active", "rejected"]
    approvedByUserId: str | None = None
    approvalAt: str | None = None
    rejectionAt: str | None = None
    availability: bool


class ProfileUpsert(BaseModel):
    role: Literal["manager", "professional"]
    cpf: str | None = None
    phone: str

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        digits = "".join(filter(str.isdigit, value))
        if len(digits) < 10:
            raise ValueError("Telefone inválido")
        return value
