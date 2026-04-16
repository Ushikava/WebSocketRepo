import json
import uuid
import os
import shutil
from typing import Dict
from datetime import datetime, timezone

from fastapi import APIRouter, UploadFile, File, Query, HTTPException, Depends
from fastapi.responses import JSONResponse

from db.session import SessionLocal
from auth import get_user_from_token

UPLOADS_DIR = "videos"
ALLOWED_MIME_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}
ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
os.makedirs(UPLOADS_DIR, exist_ok=True)


router = APIRouter(
    prefix="/ushikaVamp4",
    tags=["ushikaVamp4"]
)

@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    current_user: str = Depends(get_user_from_token)
):
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(status_code=400, detail="Недопустимый формат файла")
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Недопустимый формат файла")
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    vid_id = str(uuid.uuid4())

    return {"id": vid_id, "url": f"/videos/{filename}"}


