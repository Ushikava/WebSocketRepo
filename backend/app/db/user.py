from datetime import datetime
from sqlalchemy.orm import Session
from models.user import UserData, RefreshToken


def create_user(db: Session, username: str, email: str, hashed_password: str) -> int:
    user = UserData(username=username, email=email, hashed_password=hashed_password)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user.id


def get_user_by_username(db: Session, username: str):
    return db.query(UserData).filter(UserData.username == username).first()


def get_user_by_email(db: Session, email: str):
    return db.query(UserData).filter(UserData.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    return db.query(UserData).filter(UserData.id == user_id).first()


def save_refresh_token(db: Session, user_id: int, token: str, expires_at: datetime):
    rt = RefreshToken(user_id=user_id, token=token, expires_at=expires_at)
    db.add(rt)
    db.commit()


def get_refresh_token(db: Session, token: str):
    return db.query(RefreshToken).filter(RefreshToken.token == token).first()


def delete_refresh_token(db: Session, token: str):
    db.query(RefreshToken).filter(RefreshToken.token == token).delete()
    db.commit()


def delete_all_refresh_tokens(db: Session, user_id: int):
    db.query(RefreshToken).filter(RefreshToken.user_id == user_id).delete()
    db.commit()


def update_username(db: Session, user_id: int, new_username: str) -> None:
    db.query(UserData).filter(UserData.id == user_id).update({"username": new_username})
    db.commit()


def update_password(db: Session, user_id: int, new_hashed: str) -> None:
    db.query(UserData).filter(UserData.id == user_id).update({"hashed_password": new_hashed})
    db.commit()

