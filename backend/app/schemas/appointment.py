from datetime import datetime
from typing import Literal
from pydantic import BaseModel, ConfigDict, field_validator


class AppointmentBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    professionalId: str
    serviceId: int
    date: datetime
    customerName: str
    price: int
    commissionRate: int
    paymentMethod: Literal["cash", "pix", "card"]
    transactionId: str | None = None
    proofUrl: str | None = None
    status: str
    possibleDuplicate: bool


class AppointmentCreate(BaseModel):
    serviceId: int
    customerName: str
    paymentMethod: Literal["cash", "pix", "card"]
    price: int
    transactionId: str | None = None
    proofUrl: str | None = None

    @field_validator("customerName")
    @classmethod
    def validate_customer(cls, value: str) -> str:
        if len(value.strip()) < 2:
            raise ValueError("Nome do cliente inválido")
        return value

    @field_validator("transactionId")
    @classmethod
    def validate_transaction_id(cls, value: str | None, info) -> str | None:
        payment_method = info.data.get("paymentMethod")
        if payment_method in {"pix", "card"} and not value:
            raise ValueError("Identificador da transação é obrigatório")
        return value


class AppointmentStatusUpdate(BaseModel):
    status: Literal["pending", "confirmed", "rejected"]
    reason: str | None = None
