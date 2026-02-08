import os
import secrets
from pathlib import Path
from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.upload import UploadRequest, UploadResponse

router = APIRouter(prefix="/api/uploads", tags=["uploads"])
rate_limiter = RateLimiter(max_requests=20, window_seconds=60)


@router.post("/request-url", response_model=UploadResponse)
async def request_upload_url(payload: UploadRequest, request: Request, _user: User = Depends(get_current_user)):
    rate_limiter.hit(f"upload:{request.client.host}")
    token = secrets.token_hex(16)
    safe_name = Path(payload.name).name
    object_path = f"uploads/{token}/{safe_name}"
    upload_url = f"/api/uploads/{token}/{safe_name}"
    file_url = f"/uploads/{token}/{safe_name}"
    return UploadResponse(uploadURL=upload_url, objectPath=object_path, fileUrl=file_url)


@router.put("/{token}/{filename}")
async def upload_file(token: str, filename: str, request: Request, _user: User = Depends(get_current_user)):
    content = await request.body()
    directory = Path(settings.upload_dir) / token
    os.makedirs(directory, exist_ok=True)
    file_path = directory / Path(filename).name
    file_path.write_bytes(content)
    return JSONResponse({"ok": True})
