import json
import uuid
import os
import shutil
from typing import Dict
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, UploadFile, File, Query
from fastapi.responses import JSONResponse

from db.session import SessionLocal
from db import canvas as canvas_db

router = APIRouter(prefix="/canvas", tags=["canvas"])

UPLOADS_DIR = "uploads"
os.makedirs(UPLOADS_DIR, exist_ok=True)


class ConnectionManager:
    def __init__(self):
        self.active: Dict[str, WebSocket] = {}

    async def connect(self, nickname: str, ws: WebSocket):
        await ws.accept()
        self.active[nickname] = ws

    def disconnect(self, nickname: str):
        self.active.pop(nickname, None)

    async def broadcast(self, message: dict, exclude: str = ""):
        data = json.dumps(message, ensure_ascii=False)
        dead = []
        for nick, ws in list(self.active.items()):
            if nick == exclude:
                continue
            try:
                await ws.send_text(data)
            except Exception:
                dead.append(nick)
        for nick in dead:
            self.active.pop(nick, None)


manager = ConnectionManager()


@router.get("/state")
async def get_state():
    db = SessionLocal()
    try:
        lines = canvas_db.get_all_lines(db)
        images = canvas_db.get_all_images(db)
        messages = canvas_db.get_all_chat_messages(db)
        return {
            "lines": [
                {
                    "id": l.id,
                    "user": l.user,
                    "points": json.loads(l.points),
                    "color": l.color,
                    "strokeWidth": l.stroke_width,
                    "compositeOp": l.composite_op,
                }
                for l in lines
            ],
            "images": [
                {
                    "id": i.id,
                    "user": i.user,
                    "url": f"/uploads/{i.filename}",
                    "x": i.x,
                    "y": i.y,
                    "width": i.width,
                    "height": i.height,
                }
                for i in images
            ],
            "background": (
                f"/uploads/{canvas_db.get_setting(db, 'background_filename')}"
                if canvas_db.get_setting(db, "background_filename")
                else None
            ),
            "messages": [
                {
                    "id": m.id,
                    "user": m.user,
                    "text": m.text,
                    "msg_type": m.msg_type,
                    "extra": json.loads(m.extra) if m.extra else None,
                    "timestamp": m.created_at.isoformat(),
                }
                for m in messages
            ],
        }
    finally:
        db.close()


@router.post("/background")
async def set_background(
    file: UploadFile = File(...),
    user: str = Query(default="unknown"),
):
    ext = os.path.splitext(file.filename or "bg.png")[1] or ".png"
    filename = f"bg_{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    db = SessionLocal()
    try:
        # Delete old background file if exists
        old = canvas_db.get_setting(db, "background_filename")
        if old:
            old_path = os.path.join(UPLOADS_DIR, old)
            if os.path.exists(old_path):
                os.remove(old_path)
        canvas_db.set_setting(db, "background_filename", filename)
    finally:
        db.close()

    url = f"/uploads/{filename}"
    await manager.broadcast({"type": "set_background", "url": url})
    return {"url": url}


@router.delete("/background")
async def clear_background():
    db = SessionLocal()
    try:
        old = canvas_db.get_setting(db, "background_filename")
        if old:
            old_path = os.path.join(UPLOADS_DIR, old)
            if os.path.exists(old_path):
                os.remove(old_path)
        canvas_db.clear_setting(db, "background_filename")
    finally:
        db.close()

    await manager.broadcast({"type": "clear_background"})
    return {"ok": True}


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    user: str = Query(default="unknown"),
    x: float = Query(default=100),
    y: float = Query(default=100),
    width: float = Query(default=300),
    height: float = Query(default=200),
):
    ext = os.path.splitext(file.filename or "img.png")[1] or ".png"
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOADS_DIR, filename)
    with open(filepath, "wb") as f:
        shutil.copyfileobj(file.file, f)

    img_id = str(uuid.uuid4())
    img_data = {
        "id": img_id,
        "user": user,
        "filename": filename,
        "x": x,
        "y": y,
        "width": width,
        "height": height,
    }
    db = SessionLocal()
    try:
        canvas_db.save_image(db, img_data)
    finally:
        db.close()

    return {"id": img_id, "url": f"/uploads/{filename}", "x": x, "y": y, "width": width, "height": height}


@router.websocket("/ws/{nickname}")
async def ws_endpoint(nickname: str, websocket: WebSocket):
    await manager.connect(nickname, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            msg = json.loads(data)
            msg_type = msg.get("type")

            db = SessionLocal()
            try:
                if msg_type == "stroke_end":
                    canvas_db.save_line(db, msg["line"])
                    await manager.broadcast({"type": "draw", "line": msg["line"]}, exclude=nickname)

                elif msg_type == "move_image":
                    canvas_db.update_image_pos(db, msg["id"], msg["x"], msg["y"])
                    await manager.broadcast(msg, exclude=nickname)

                elif msg_type == "transform_image":
                    canvas_db.update_image_transform(db, msg["id"], msg["x"], msg["y"], msg["width"], msg["height"])
                    await manager.broadcast(msg, exclude=nickname)

                elif msg_type == "delete_image":
                    canvas_db.delete_image(db, msg["id"])
                    await manager.broadcast(msg, exclude=nickname)

                elif msg_type == "add_image":
                    # Already saved via REST, just broadcast to others
                    await manager.broadcast(msg, exclude=nickname)

                elif msg_type == "clear":
                    canvas_db.clear_all(db)
                    await manager.broadcast({"type": "clear"}, exclude=nickname)

                elif msg_type == "chat_message":
                    msg_id = str(uuid.uuid4())
                    ts = datetime.now(timezone.utc).isoformat()
                    text = str(msg.get("text", ""))[:500]
                    msg_data = {
                        "id": msg_id, "user": nickname, "text": text,
                        "msg_type": "text", "extra": None, "timestamp": ts,
                    }
                    canvas_db.save_chat_message(db, msg_data)
                    await manager.broadcast({"type": "chat_message", **msg_data}, exclude=nickname)

                elif msg_type == "dice_roll":
                    msg_id = str(uuid.uuid4())
                    ts = datetime.now(timezone.utc).isoformat()
                    dice = msg.get("dice", [])
                    total = sum(d["result"] for d in dice)
                    parts = ", ".join(f"d{d['sides']}={d['result']}" for d in dice)
                    text = f"бросил: {parts} (итого: {total})"
                    msg_data = {
                        "id": msg_id, "user": nickname, "text": text,
                        "msg_type": "dice", "extra": dice, "timestamp": ts,
                    }
                    canvas_db.save_chat_message(db, msg_data)
                    await manager.broadcast({"type": "chat_message", **msg_data}, exclude=nickname)

            finally:
                db.close()

    except WebSocketDisconnect:
        manager.disconnect(nickname)
