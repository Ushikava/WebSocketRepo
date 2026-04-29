from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, DateTime, Integer, ForeignKey

from db.base import Base


class UserData(Base):
    __tablename__ = "users_data"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=True)
    hashed_password = Column(Text, nullable=False)
    avatar_url = Column(String, nullable=True)
    banner_url = Column(String, nullable=True)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users_data.id"), nullable=False)
    token = Column(String, unique=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
