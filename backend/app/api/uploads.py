import hashlib
import os
import secrets
from pathlib import Path

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.rate_limiter import RateLimiter
from app.api.deps import get_current_user, get_current_profile, get_db
from app.models.user import User
from app.models.profile import Profile
from app.models.media_upload import MediaUpload
from app.schemas.upload import UploadRequest, UploadResponse, CloudinaryUploadRequest

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


async def upload_to_cloudinary(data_base64: str, folder: str):
    cloud_name = settings.cloudinary_cloud_name
    api_key = settings.cloudinary_api_key
    api_secret = settings.cloudinary_api_secret
    if not cloud_name or not api_key or not api_secret:
        raise HTTPException(status_code=500, detail={"message": "Cloudinary não configurado."})

    timestamp = str(int(__import__("time").time()))
    signature_base = f"folder={folder}&timestamp={timestamp}{api_secret}"
    signature = hashlib.sha1(signature_base.encode()).hexdigest()
    payload = {
        "file": data_base64,
        "folder": folder,
        "timestamp": timestamp,
        "api_key": api_key,
        "signature": signature,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        res = await client.post(f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload", data=payload)
    if res.status_code >= 400:
        raise HTTPException(status_code=502, detail={"message": "Falha no upload para Cloudinary."})
    return res.json()


@router.post("", status_code=201)
async def cloudinary_upload(
    payload: CloudinaryUploadRequest,
    request: Request,
    user: User = Depends(get_current_user),
    profile: Profile | None = Depends(get_current_profile),
    db: Session = Depends(get_db),
):
    rate_limiter.hit(f"cloudinary-upload:{request.client.host}")
    if not profile or not profile.shop_id:
        raise HTTPException(status_code=400, detail={"message": "Perfil sem loja vinculada."})

    payment_id = payload.paymentId if payload.paymentId is not None else payload.appointmentId
    folder = (
        f"salons/{profile.shop_id}/professionals/{user.id}/profile"
        if payload.type == "profile"
        else f"salons/{profile.shop_id}/payments/{user.id}/receipts"
    )
    cloudinary = await upload_to_cloudinary(payload.dataBase64, folder)

    media = MediaUpload(
        type=payload.type,
        shop_id=profile.shop_id,
        professional_id=user.id,
        payment_id=payment_id,
        secure_url=cloudinary["secure_url"],
        public_id=cloudinary["public_id"],
        asset_id=cloudinary["asset_id"],
    )
    db.add(media)
    if payload.type == "profile":
        user.profile_image_url = cloudinary["secure_url"]
    db.commit()

    return {"secure_url": cloudinary["secure_url"], "public_id": cloudinary["public_id"], "asset_id": cloudinary["asset_id"]}
