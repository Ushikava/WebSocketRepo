from sqlalchemy import Column, String, Float, Text, DateTime
from datetime import datetime, timezone
from db.base import Base



class CanvasSettings(Base):
    __tablename__ = "canvas_settings"

    key = Column(String, primary_key=True)
    value = Column(Text, nullable=True)


class CanvasLine(Base):
    __tablename__ = "canvas_lines"

    id = Column(String, primary_key=True)
    user = Column(String, nullable=False)
    points = Column(Text, nullable=False)   # JSON array
    color = Column(String, default="#000000")
    stroke_width = Column(Float, default=5.0)
    composite_op = Column(String, default="source-over")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class CanvasImage(Base):
    __tablename__ = "canvas_images"

    id = Column(String, primary_key=True)
    user = Column(String, nullable=False)
    filename = Column(String, nullable=False)
    x = Column(Float, default=80.0)
    y = Column(Float, default=80.0)
    width = Column(Float, nullable=False)
    height = Column(Float, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(String, primary_key=True)
    user = Column(String, nullable=False)
    text = Column(Text, nullable=False)
    msg_type = Column(String, default="text")   # "text" or "dice"
    extra = Column(Text, nullable=True)          # JSON for dice results
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
