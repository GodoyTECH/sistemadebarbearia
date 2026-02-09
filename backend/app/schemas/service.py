from pydantic import BaseModel, ConfigDict


class ServiceBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    type: str
    price: int
    commissionRate: int
    active: bool
    description: str | None = None


class ServiceCreate(BaseModel):
    name: str
    type: str
    price: int
    commissionRate: int
    active: bool = True
    description: str | None = None


class ServiceUpdate(BaseModel):
    name: str | None = None
    type: str | None = None
    price: int | None = None
    commissionRate: int | None = None
    active: bool | None = None
    description: str | None = None
