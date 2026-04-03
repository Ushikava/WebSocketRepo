import json
from sqlalchemy.orm import Session
from models.canvas import CanvasLine, CanvasImage, CanvasSettings, ChatMessage


def get_setting(db: Session, key: str) -> str | None:
    row = db.query(CanvasSettings).filter(CanvasSettings.key == key).first()
    return row.value if row else None


def set_setting(db: Session, key: str, value: str):
    row = db.query(CanvasSettings).filter(CanvasSettings.key == key).first()
    if row:
        row.value = value
    else:
        db.add(CanvasSettings(key=key, value=value))
    db.commit()


def clear_setting(db: Session, key: str):
    db.query(CanvasSettings).filter(CanvasSettings.key == key).delete()
    db.commit()


def get_all_lines(db: Session):
    return db.query(CanvasLine).order_by(CanvasLine.created_at).all()


def save_line(db: Session, line: dict):
    obj = CanvasLine(
        id=line["id"],
        user=line["user"],
        points=json.dumps(line["points"]),
        color=line["color"],
        stroke_width=line["strokeWidth"],
        composite_op=line.get("compositeOp", "source-over"),
    )
    db.add(obj)
    db.commit()


def get_all_images(db: Session):
    return db.query(CanvasImage).order_by(CanvasImage.created_at).all()


def save_image(db: Session, img: dict):
    obj = CanvasImage(
        id=img["id"],
        user=img["user"],
        filename=img["filename"],
        x=img["x"],
        y=img["y"],
        width=img["width"],
        height=img["height"],
        rotation=img.get("rotation", 0.0),
    )
    db.add(obj)
    db.commit()


def update_image_pos(db: Session, img_id: str, x: float, y: float):
    obj = db.query(CanvasImage).filter(CanvasImage.id == img_id).first()
    if obj:
        obj.x = x
        obj.y = y
        db.commit()


def update_image_transform(db: Session, img_id: str, x: float, y: float, width: float, height: float, rotation: float = 0.0):
    obj = db.query(CanvasImage).filter(CanvasImage.id == img_id).first()
    if obj:
        obj.x = x
        obj.y = y
        obj.width = width
        obj.height = height
        obj.rotation = rotation
        db.commit()


def delete_image(db: Session, img_id: str):
    db.query(CanvasImage).filter(CanvasImage.id == img_id).delete()
    db.commit()


def clear_all(db: Session):
    db.query(CanvasLine).delete()
    db.query(CanvasImage).delete()
    db.commit()


def save_chat_message(db: Session, msg: dict):
    obj = ChatMessage(
        id=msg["id"],
        user=msg["user"],
        text=msg["text"],
        msg_type=msg.get("msg_type", "text"),
        extra=json.dumps(msg["extra"]) if msg.get("extra") is not None else None,
    )
    db.add(obj)
    db.commit()


def get_all_chat_messages(db: Session):
    return db.query(ChatMessage).order_by(ChatMessage.created_at).all()
