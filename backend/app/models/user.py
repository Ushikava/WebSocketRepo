from datetime import datetime, timezone

from sqlalchemy import Column, String, Float, Text, DateTime, Integer

from db.base import Base


class UserData(Base):
    __tablename__ = "users_data"

    id = Column(Integer, primary_key=True)
    username = Column(String, unique=True, nullable=False)
    hashed_password = Column(Text, nullable=False)