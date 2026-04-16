from sqlalchemy.orm import Session
from models.user import UserData


def create_user(db: Session, username: str, hashed_password: str):
    user_obj = UserData(
        username=username,
        hashed_password=hashed_password
        )
    db.add(user_obj)
    db.commit()
    db.refresh(user_obj)
    return user_obj.id


def get_user_by_username(db: Session, username: str):
    return db.query(UserData).filter(UserData.username == username).first()
