from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr

from auth import create_access_token, create_refresh_token
from db.session import SessionLocal
from db import user as user_db

pwd_context = CryptContext(schemes=["bcrypt"])

router = APIRouter(tags=["auth"])


class RegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


@router.post("/register")
def user_register(body: RegisterRequest):
    db = SessionLocal()
    try:
        if user_db.get_user_by_email(db, body.email):
            raise HTTPException(status_code=400, detail="Email уже используется")
        if user_db.get_user_by_username(db, body.username):
            raise HTTPException(status_code=400, detail="Никнейм уже занят")

        hashed = pwd_context.hash(body.password)
        user_id = user_db.create_user(db, body.username, body.email, hashed)

        access_token = create_access_token(user_id, body.username)
        refresh_token, expires_at = create_refresh_token()
        user_db.save_refresh_token(db, user_id, refresh_token, expires_at)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "username": body.username,
        }
    finally:
        db.close()


@router.post("/login")
def user_login(body: LoginRequest):
    db = SessionLocal()
    try:
        user = user_db.get_user_by_email(db, body.email)
        if not user or not pwd_context.verify(body.password, user.hashed_password):
            raise HTTPException(status_code=401, detail="Неверные учетные данные")

        access_token = create_access_token(user.id, user.username)
        refresh_token, expires_at = create_refresh_token()
        user_db.save_refresh_token(db, user.id, refresh_token, expires_at)

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "username": user.username,
        }
    finally:
        db.close()


@router.post("/refresh")
def refresh_token(body: RefreshRequest):
    db = SessionLocal()
    try:
        rt = user_db.get_refresh_token(db, body.refresh_token)
        if not rt:
            raise HTTPException(status_code=401, detail="Недействительный refresh token")
        if rt.expires_at.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            user_db.delete_refresh_token(db, body.refresh_token)
            raise HTTPException(status_code=401, detail="Refresh token истёк")

        user = user_db.get_user_by_id(db, rt.user_id)
        if not user:
            raise HTTPException(status_code=401, detail="Пользователь не найден")

        user_db.delete_refresh_token(db, body.refresh_token)

        access_token = create_access_token(user.id, user.username)
        new_refresh_token, expires_at = create_refresh_token()
        user_db.save_refresh_token(db, user.id, new_refresh_token, expires_at)

        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "token_type": "bearer",
        }
    finally:
        db.close()


@router.post("/logout")
def logout(body: RefreshRequest):
    db = SessionLocal()
    try:
        user_db.delete_refresh_token(db, body.refresh_token)
        return {"status": "ok"}
    finally:
        db.close()
