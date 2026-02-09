from pydantic import BaseModel, ConfigDict, EmailStr


class UserBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr | None = None
    firstName: str | None = None
    lastName: str | None = None
    phone: str | None = None
    role: str
    storeId: str | None = None
    profileImageUrl: str | None = None


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    lastName: str | None = None
    phone: str
    role: str
    storeNumber: str | None = None
    storeName: str | None = None
