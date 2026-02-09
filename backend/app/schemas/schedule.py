from datetime import datetime, time
from typing import Literal
from pydantic import BaseModel, ConfigDict


class AvailabilityBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    professionalId: str
    weekday: int
    startTime: time
    endTime: time
    active: bool


class AvailabilityCreate(BaseModel):
    weekday: int
    startTime: time
    endTime: time


class BlockBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    professionalId: str
    startAt: datetime
    endAt: datetime
    reason: str | None = None


class BlockCreate(BaseModel):
    startAt: datetime
    endAt: datetime
    reason: str | None = None


class RequestBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    professionalId: str | None = None
    serviceId: int | None = None
    customerName: str
    customerPhone: str
    requestedAt: datetime
    status: str


class RequestCreate(BaseModel):
    professionalId: str | None = None
    serviceId: int | None = None
    customerName: str
    customerPhone: str
    requestedAt: datetime


class RequestStatusUpdate(BaseModel):
    status: Literal[
        "requested",
        "pending_professional_confirmation",
        "confirmed",
        "rejected",
        "rescheduled",
        "cancelled",
        "expired",
    ]
