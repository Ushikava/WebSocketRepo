import uuid
import os
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from auth import get_user_from_token, get_optional_user
from db.session import SessionLocal
from db import video as video_db

UPLOADS_DIR = "videos"
ALLOWED_MIME_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}
ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
os.makedirs(UPLOADS_DIR, exist_ok=True)


router = APIRouter(
    prefix="/ushikavamp4",
    tags=["ushikavamp4"]
)


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    title: str = Query(...),
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

    db = SessionLocal()
    try:
        slug = video_db.save_video(db, filename=filename, uploaded_by=current_user, title=title)
    finally:
        db.close()

    return {"slug": slug, "url": f"/videos/{filename}", "filename": filename}


@router.get("/videos")
async def list_videos(
    offset: int = 0,
    limit: int = 20,
    current_user: str = Depends(get_optional_user),
):
    db = SessionLocal()
    try:
        videos_list = video_db.get_all_video(db, offset=offset, limit=limit, current_user=current_user)
    finally:
        db.close()
    return videos_list


@router.post("/video/{slug}/view")
async def record_view(slug: str):
    db = SessionLocal()
    try:
        video_db.increment_views(db, slug)
    finally:
        db.close()
    return {"ok": True}


@router.get("/video/{slug}")
async def choose_video(slug: str, current_user: str = Depends(get_optional_user)):
    db = SessionLocal()
    try:
        selected_video = video_db.get_video_by_slug(db, slug, current_user=current_user)
        if not selected_video:
            raise HTTPException(status_code=404, detail="Видео не найдено")
    finally:
        db.close()
    return selected_video


@router.post("/video/{slug}/like")
async def like_video(slug: str, current_user: str = Depends(get_user_from_token)):
    db = SessionLocal()
    try:
        result = video_db.toggle_like(db, slug, current_user)
        if result is None:
            raise HTTPException(status_code=404, detail="Видео не найдено")
    finally:
        db.close()
    return result
