from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from passlib.context import CryptContext

from auth import create_jwt_token
from db.session import SessionLocal
from db import user as user_db

pwd_context = CryptContext(schemes=["bcrypt"])

router = APIRouter(
    tags=["auth"]
)

@router.post("/register")
def user_register(username: str, password: str):
    """
    Этот маршрут регистрирует нового пользователяы.
    """
    db = SessionLocal()
    try:
        existing_user = user_db.get_user_by_username(db, username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Пользователь уже существует")

        hashed_password = pwd_context.hash(password)
        new_user_id = user_db.create_user(db, username, hashed_password)
        return {"status": "ok", "user_id": new_user_id}

    finally:
        db.close()
    


@router.post("/login")
def user_login(form_data: OAuth2PasswordRequestForm = Depends()):
    db = SessionLocal()
    try:
        existing_user = user_db.get_user_by_username(db, form_data.username)
        if not existing_user:
            raise HTTPException(status_code=401, detail="Неверные учетные данные")

        if not pwd_context.verify(form_data.password, existing_user.hashed_password):
            raise HTTPException(status_code=401, detail="Неверные учетные данные")

        token = create_jwt_token({
                "sub": str(existing_user.id),
                "username": existing_user.username,
            })
        return {"access_token": token, "token_type": "bearer"}

    finally:
        db.close()

