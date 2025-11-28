from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import SessionLocal
from app.db import messages

chat = APIRouter(
    tags=["chat"]
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@chat.get("/all_messages")
def send_message(db: Session = Depends(get_db)):
    return messages.get_messages(db)


@chat.post("/message")
def send_message(text: str, sender_id: int, category: str = "general", db: Session = Depends(get_db)):
    return messages.add_message(db, sender_id, category, text)