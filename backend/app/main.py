import os
import pathlib

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from api.router import router as ping_router
from api.canvas import router as canvas_router
from db.session import engine
from db.base import Base
import models.canvas

Base.metadata.create_all(bind=engine)

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)

app = FastAPI(title="Ushikava Backend")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ping_router, prefix="/api")
app.include_router(canvas_router, prefix="/api")

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
DIST_DIR = pathlib.Path(__file__).parent.parent.parent / "frontend" / "dist"
app.mount("/", StaticFiles(directory=str(DIST_DIR), html=True), name="static")
