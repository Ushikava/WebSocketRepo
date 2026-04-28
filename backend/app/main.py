import os
import pathlib

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.responses import FileResponse
from pydantic import BaseModel

from api.router import router as ping_router
from api.canvas import router as canvas_router
from api.video import router as uflow_router
from api.auth import router as auth_router

UPLOADS_DIR = "uploads"
VIDEOS_DIR = "videos"
os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(VIDEOS_DIR, exist_ok=True)

app = FastAPI(title="Ushikava Backend")
security = HTTPBasic()

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
app.include_router(uflow_router, prefix="/api")
app.include_router(auth_router, prefix="/api")

app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")
app.mount("/videos", StaticFiles(directory=VIDEOS_DIR), name="videos")
DIST_DIR = pathlib.Path(__file__).parent.parent.parent / "frontend" / "dist"

app.mount("/assets", StaticFiles(directory=str(DIST_DIR / "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_spa(full_path: str = "") -> FileResponse:
    file_path = DIST_DIR / full_path
    if file_path.is_file():
        return FileResponse(str(file_path))
    return FileResponse(str(DIST_DIR / "index.html"))
