from pydantic import BaseModel, ConfigDict


class StoreBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    storeNumber: str
    storeName: str
