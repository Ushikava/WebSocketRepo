from datetime import datetime, timezone

from sqlalchemy import Column, String, DateTime, Integer, ForeignKey, UniqueConstraint

from db.base import Base


class UploadedVideos(Base):
    __tablename__ = "uploaded_videos"

    id = Column(Integer, primary_key=True)
    slug = Column(String, unique=True, nullable=False, index=True)
    filename = Column(String, nullable=False)
    uploaded_by = Column(Integer, ForeignKey("users_data.id"), nullable=False)
    title = Column(String, nullable=False)
    uploaded_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class VideoStats(Base):
    __tablename__ = "video_stats"

    id = Column(Integer, primary_key=True)
    video_id = Column(Integer, ForeignKey("uploaded_videos.id"), nullable=False)
    views = Column(Integer, default=0)
    likes = Column(Integer, default=0)


class VideoLike(Base):
    __tablename__ = "video_likes"

    id = Column(Integer, primary_key=True)
    video_id = Column(Integer, ForeignKey("uploaded_videos.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users_data.id"), nullable=False)

    __table_args__ = (UniqueConstraint("video_id", "user_id", name="uq_video_like"),)