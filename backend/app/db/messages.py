from sqlalchemy.orm import Session
from datetime import datetime

from ..models.messages import Message


def get_messages(db: Session):
    return db.query(Message).all()


def add_message(db: Session, sender: int, category:str, text: str):
    msg = Message(sender_id=sender, message_text=text, category = category, sent_at = datetime.now())
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
