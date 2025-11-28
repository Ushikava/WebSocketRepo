from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import router
from .api.chat import chat

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


app.include_router(router, prefix="/api")
app.include_router(chat, prefix="/chat")