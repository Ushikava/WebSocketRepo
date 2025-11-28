from fastapi import FastAPI
from .api.router import router
from .api.chat import chat

app = FastAPI(title="Ushikava Backend")


app.include_router(router, prefix="/api")
app.include_router(chat, prefix="/chat")