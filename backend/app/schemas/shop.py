from pydantic import BaseModel, ConfigDict


class ShopBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    code: str
    managerUserId: str
