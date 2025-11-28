from sqlalchemy import Column, Integer, Text, String, DateTime

from ..db.base import Base


class Message(Base):
    __tablename__ = "wall_messages"

    id = Column(Integer, primary_key=True)
    sender_id = Column(Integer, nullable=False)
    message_text = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    sent_at = Column(DateTime, nullable=False)
