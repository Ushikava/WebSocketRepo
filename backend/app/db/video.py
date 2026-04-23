import secrets

from sqlalchemy.orm import Session
from models.video import UploadedVideos, VideoStats, VideoLike


def _generate_slug(db: Session) -> str:
    while True:
        slug = secrets.token_urlsafe(6)
        if not db.query(UploadedVideos).filter(UploadedVideos.slug == slug).first():
            return slug


def _row_to_dict(video: UploadedVideos, views: int, likes: int, is_liked: bool = False) -> dict:
    return {
        "id": video.id,
        "slug": video.slug,
        "filename": video.filename,
        "uploaded_by": video.uploaded_by,
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


def get_all_video(db: Session, offset: int = 0, limit: int = 20, current_user: str = None):
    rows = (
        db.query(UploadedVideos, VideoStats.views, VideoStats.likes)
        .join(VideoStats, VideoStats.video_id == UploadedVideos.id, isouter=True)
        .order_by(UploadedVideos.uploaded_at.desc())
        .offset(offset).limit(limit).all()
    )
    result = []
    for v, views, likes in rows:
        is_liked = False
        if current_user:
            is_liked = db.query(VideoLike).filter(
                VideoLike.video_id == v.id,
                VideoLike.user_id == current_user,
            ).first() is not None
        result.append(_row_to_dict(v, views, likes, is_liked))
    return result


def get_video_by_slug(db: Session, slug: str, current_user: str = None):
    row = (
        db.query(UploadedVideos, VideoStats.views, VideoStats.likes)
        .join(VideoStats, VideoStats.video_id == UploadedVideos.id, isouter=True)
        .filter(UploadedVideos.slug == slug)
        .first()
    )
    if not row:
        return None
    v, views, likes = row
    is_liked = False
    if current_user:
        is_liked = db.query(VideoLike).filter(
            VideoLike.video_id == v.id,
            VideoLike.user_id == current_user,
        ).first() is not None
    return _row_to_dict(v, views, likes, is_liked)


def increment_views(db: Session, slug: str):
    video = db.query(UploadedVideos).filter(UploadedVideos.slug == slug).first()
    if not video:
        return
    stats = db.query(VideoStats).filter(VideoStats.video_id == video.id).first()
    if stats:
        stats.views += 1
        db.commit()


def toggle_like(db: Session, slug: str, username: str) -> dict:
    video = db.query(UploadedVideos).filter(UploadedVideos.slug == slug).first()
    if not video:
        return None
    existing = db.query(VideoLike).filter(
        VideoLike.video_id == video.id,
        VideoLike.user_id == username,
    ).first()
    stats = db.query(VideoStats).filter(VideoStats.video_id == video.id).first()
    if existing:
        db.delete(existing)
        if stats:
            stats.likes = max(0, stats.likes - 1)
        db.commit()
        return {"is_liked": False, "likes": stats.likes if stats else 0}
    else:
        db.add(VideoLike(video_id=video.id, user_id=username))
        if stats:
            stats.likes += 1
        db.commit()
        return {"is_liked": True, "likes": stats.likes if stats else 1}
