from pydantic import BaseModel


class UploadRequest(BaseModel):
    name: str
    size: int
    contentType: str


class UploadResponse(BaseModel):
    uploadURL: str
    objectPath: str
    fileUrl: str
