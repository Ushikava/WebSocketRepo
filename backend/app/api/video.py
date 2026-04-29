import uuid
import os
import shutil
from pathlib import Path
from passlib.context import CryptContext
from pydantic import BaseModel
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Query
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db import video as video_db
from db import user as user_db
from db.session import get_db
from auth import get_user_from_token, get_optional_user


UPLOADS_DIR = "videos"
AVATAR_DIR = Path("uploads") / "avatars"
BANNER_DIR = Path("uploads") / "banners"
ALLOWED_MIME_TYPES = {"video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"}
ALLOWED_IMG_EXT = {"jpg", "jpeg", "png", "webp"}
ALLOWED_EXTENSIONS = {".mp4", ".webm", ".mov", ".avi"}
os.makedirs(UPLOADS_DIR, exist_ok=True)


pwd_context = CryptContext(schemes=["bcrypt"])


class UsernameUpdate(BaseModel):
    username: str


class PasswordUpdate(BaseModel):
    current_password: str
    new_password: str


router = APIRouter(
    prefix="/uflow",
    tags=["uflow"]
)


@router.post("/video")
async def upload_video(
    file: UploadFile = File(...),
    title: str = Query(...),
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
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

    slug = video_db.save_video(db, filename=filename, uploaded_by=current_user_id, title=title)

    return {"slug": slug, "url": f"/videos/{filename}", "filename": filename}


@router.get("/videos")
async def list_videos(
    offset: int = 0,
    limit: int = 20,
    current_user: Optional[int] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    videos_list = video_db.get_all_video(db, offset=offset, limit=limit, current_user=current_user)
    return videos_list


@router.get("/likes")
async def list_liked_videos(
    offset: int = 0,
    limit: int = 20,
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    videos_list = video_db.get_all_liked_video(db, offset=offset, limit=limit, current_user=current_user_id)
    return videos_list



@router.post("/video/{slug}/view")
async def record_view(
    slug: str,
    db: Session = Depends(get_db)
):
    video_db.increment_views(db, slug)
    return {"ok": True}


@router.get("/video/{slug}")
async def choose_video(
    slug: str,
    current_user: Optional[int] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    selected_video = video_db.get_video_by_slug(db, slug, current_user=current_user)
    if not selected_video:
        raise HTTPException(status_code=404, detail="Видео не найдено")
    return selected_video


@router.delete("/video/{slug}")
async def delete_video(
    slug: str,
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    result = video_db.delete_video(db, slug=slug, user_id=current_user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Видео не найдено")
    if result is False:
        raise HTTPException(status_code=403, detail="Нет доступа")

    return {"ok": True}


@router.post("/video/{slug}/like")
async def like_video(
    slug: str,
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    result = video_db.toggle_like(db, slug, current_user_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Видео не найдено")

    return result


@router.get("/user/{username}")
async def user_info(
    username: str,
    current_user: Optional[int] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    user_info = video_db.get_user_info(db, username, current_user=current_user)
    if not user_info:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user_info


@router.get("/user/{username}/videos")
async def list_videos_by_user(
    username: str,
    offset: int = 0,
    limit: int = 20,
    current_user: Optional[int] = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    videos_list = video_db.get_all_video_by_user(db, username=username, offset=offset, limit=limit, current_user=current_user)

    return videos_list


@router.post("/user/avatar")
async def upload_avatar(
    file: UploadFile,
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMG_EXT:
        raise HTTPException(status_code=400, detail="Invalid file type")

    AVATAR_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{current_user_id}.{ext}"
    with open(AVATAR_DIR / filename, "wb") as f:
        f.write(await file.read())

    url = f"/avatars/{filename}"

    video_db.upload_avatar(db, url=url, uploaded_by=current_user_id)

    return {"avatar_url": url}


@router.post("/user/banner")
async def upload_banner(
    file: UploadFile,
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename")
    ext = file.filename.rsplit(".", 1)[-1].lower()
    if ext not in ALLOWED_IMG_EXT:
        raise HTTPException(status_code=400, detail="Invalid file type")

    BANNER_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{current_user_id}.{ext}"
    with open(BANNER_DIR / filename, "wb") as f:
        f.write(await file.read())

    url = f"/banners/{filename}"

    video_db.upload_banner(db, url=url, uploaded_by=current_user_id)
        
    return {"banner_url": url}


@router.patch("/user/me")
def update_username(
    body: UsernameUpdate,
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):
    if user_db.get_user_by_username(db, body.username):
        raise HTTPException(status_code=400, detail="Никнейм уже занят")
    try:
        user_db.update_username(db, current_user_id, body.username)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="Никнейм уже занят")
    
    return {"username": body.username}



@router.post("/user/password")
def update_password(
    body: PasswordUpdate,
    current_user_id: int = Depends(get_user_from_token),
    db: Session = Depends(get_db)
):  
    user = user_db.get_user_by_id(db, current_user_id)
    if not user or not pwd_context.verify(body.current_password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    new_hashed = pwd_context.hash(body.new_password)
    user_db.update_password(db, current_user_id, new_hashed)

    return {"ok": True}

