from typing import Literal
from pydantic import BaseModel


class UploadRequest(BaseModel):
    name: str
    size: int
    contentType: str


class UploadResponse(BaseModel):
    uploadURL: str
    objectPath: str
    fileUrl: str


class CloudinaryUploadRequest(BaseModel):
    type: Literal["profile", "receipt"]
    dataBase64: str
    paymentId: int | None = None
    appointmentId: int | None = None
