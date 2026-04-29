import os
import secrets

from sqlalchemy.orm import Session
from sqlalchemy.sql import func
from models.video import UploadedVideos, VideoStats, VideoLike
from models.user import UserData

def _generate_slug(db: Session) -> str:
    while True:
        slug = secrets.token_urlsafe(6)
        if not db.query(UploadedVideos).filter(UploadedVideos.slug == slug).first():
            return slug


def _row_to_dict(video: UploadedVideos, uploaded_username: str, views: int, likes: int, is_liked: bool = False) -> dict:
    return {
        "id": video.id,
        "slug": video.slug,
        "filename": video.filename,
        "uploaded_by": uploaded_username,
        "title": video.title,
        "uploaded_at": video.uploaded_at,
        "views": views or 0,
        "likes": likes or 0,
        "is_liked": is_liked,
    }


def save_video(db: Session, filename: str, uploaded_by: str, title: str):
    slug = _generate_slug(db)
    video_obj = UploadedVideos(slug=slug, filename=filename, uploaded_by=uploaded_by, title=title)
    db.add(video_obj)
    db.commit()
    db.refresh(video_obj)

    stats_obj = VideoStats(video_id=video_obj.id, views=0, likes=0)
    db.add(stats_obj)
    db.commit()

    return video_obj.slug


def get_all_video(db: Session, offset: int = 0, limit: int = 20, current_user: int = None):
    rows = (
        db.query(UploadedVideos, VideoStats.views, VideoStats.likes, UserData.username)
        .join(VideoStats, VideoStats.video_id == UploadedVideos.id, isouter=True)
        .join(UserData, UserData.id == UploadedVideos.uploaded_by)
        .order_by(UploadedVideos.uploaded_at.desc())
        .offset(offset).limit(limit).all()
    )
    result = []
    for v, views, likes, uname in rows:
        is_liked = False
        if current_user:
            is_liked = db.query(VideoLike).filter(
                VideoLike.video_id == v.id,
                VideoLike.user_id == current_user,
            ).first() is not None
        result.append(_row_to_dict(v, uname, views, likes, is_liked))
    return result


def get_all_video_by_user(db: Session, username: str, offset: int = 0, limit: int = 20, current_user: int = None):
    rows = (
        db.query(UploadedVideos, VideoStats.views, VideoStats.likes, UserData.username)
        .join(VideoStats, VideoStats.video_id == UploadedVideos.id, isouter=True)
        .join(UserData, UserData.id == UploadedVideos.uploaded_by)
        .where(UserData.username == username)
        .order_by(UploadedVideos.uploaded_at.desc())
        .offset(offset).limit(limit).all()
    )
    result = []
    for v, views, likes, uname in rows:
        is_liked = False
        if current_user:
            is_liked = db.query(VideoLike).filter(
                VideoLike.video_id == v.id,
                VideoLike.user_id == current_user,
            ).first() is not None
        result.append(_row_to_dict(v, uname, views, likes, is_liked))
    return result


def get_video_by_slug(db: Session, slug: str, current_user: int = None):
    row = (
        db.query(UploadedVideos, VideoStats.views, VideoStats.likes, UserData.username)
        .join(VideoStats, VideoStats.video_id == UploadedVideos.id, isouter=True)
        .join(UserData, UserData.id == UploadedVideos.uploaded_by)
        .filter(UploadedVideos.slug == slug)
        .first()
    )
    if not row:
        return None
    v, views, likes, uname = row
    is_liked = False
    if current_user:
        is_liked = db.query(VideoLike).filter(
            VideoLike.video_id == v.id,
            VideoLike.user_id == current_user,
        ).first() is not None
    return _row_to_dict(v, uname, views, likes, is_liked)


def increment_views(db: Session, slug: str):
    video = db.query(UploadedVideos).filter(UploadedVideos.slug == slug).first()
    if not video:
        return
    stats = db.query(VideoStats).filter(VideoStats.video_id == video.id).first()
    if stats:
        stats.views += 1
        db.commit()


def toggle_like(db: Session, slug: str, user_id: int) -> dict:
    video = db.query(UploadedVideos).filter(UploadedVideos.slug == slug).first()
    if not video:
        return None
    existing = db.query(VideoLike).filter(
        VideoLike.video_id == video.id,
        VideoLike.user_id == user_id,
    ).first()
    stats = db.query(VideoStats).filter(VideoStats.video_id == video.id).first()
    if existing:
        db.delete(existing)
        if stats:
            stats.likes = max(0, stats.likes - 1)
        db.commit()
        return {"is_liked": False, "likes": stats.likes if stats else 0}
    else:
        db.add(VideoLike(video_id=video.id, user_id=user_id))
        if stats:
            stats.likes += 1
        db.commit()
        return {"is_liked": True, "likes": stats.likes if stats else 1}


def delete_video(db: Session, slug: str, user_id: int):
    video = db.query(UploadedVideos).filter(UploadedVideos.slug == slug).first()
    if not video:
        return None
    if video.uploaded_by != user_id:
        return False
    filepath = os.path.join("videos", video.filename)
    if os.path.exists(filepath):
        os.remove(filepath)
    db.query(VideoLike).filter(VideoLike.video_id == video.id).delete()
    db.query(VideoStats).filter(VideoStats.video_id == video.id).delete()
    db.delete(video)
    db.commit()
    return True


def get_all_liked_video(db: Session, offset: int = 0, limit: int = 20, current_user: int = None):
    if not current_user:
        return []
    rows = (
        db.query(UploadedVideos, VideoStats.views, VideoStats.likes, UserData.username)
        .join(VideoStats, VideoStats.video_id == UploadedVideos.id, isouter=True)
        .join(VideoLike, VideoLike.video_id == UploadedVideos.id)
        .join(UserData, UserData.id == UploadedVideos.uploaded_by)
        .where(VideoLike.user_id == current_user)
        .order_by(UploadedVideos.uploaded_at.desc())
        .offset(offset).limit(limit).all()
    )
    return [_row_to_dict(v, uname, views, likes, is_liked=True) for v, views, likes, uname in rows]


def get_user_info(db: Session, username: str, current_user: int = None) -> dict | None:
    user = db.query(UserData).filter(UserData.username == username).first()
    if not user:
        return None

    stats = (
        db.query(func.sum(VideoStats.views).label("total_views"),
                 func.sum(VideoStats.likes).label("total_likes"),
                 func.count(VideoStats.id).label("video_count"))
        .select_from(UploadedVideos)
        .join(VideoStats, VideoStats.video_id == UploadedVideos.id, isouter=True)
        .join(UserData, UserData.id == UploadedVideos.uploaded_by)
        .where(UserData.username == username).first()
    )

    return {
        "username": username,
        "video_count": stats.video_count if stats else 0,
        "total_views": stats.total_views or 0 if stats else 0,
        "total_likes": stats.total_likes or 0 if stats else 0,
        "avatar_url": user.avatar_url,
        "banner_url": user.banner_url,
    }


def upload_avatar(db: Session, url: str, uploaded_by: int) -> None:
    db.query(UserData).filter(UserData.id == uploaded_by).update({"avatar_url": url})
    db.commit()


def upload_banner(db: Session, url: str, uploaded_by: int) -> None:
    db.query(UserData).filter(UserData.id == uploaded_by).update({"banner_url": url})
    db.commit()

