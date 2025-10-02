from fastapi import FastAPI, WebSocket, WebSocketDisconnect

import json

app = FastAPI()

waiting: WebSocket | None = None
pairs: dict[WebSocket, WebSocket] = {}
active_connections = set()


@app.websocket("/ws/chat")
async def chat_endpoint(ws: WebSocket):
    global waiting, pairs
    await ws.accept()
    active_connections.add(ws)

    await broadcast_count()

    try:
        while True:
            msg = await ws.receive_text()
            data = json.loads(msg)
            msg_type = data.get("type")

            if msg_type == "join":
                if waiting is None:
                    waiting = ws
                    await ws.send_text(json.dumps({"type": "status", "data": "waiting"}))
                    await broadcast_count()
                else:
                    partner = waiting
                    waiting = None
                    pairs[ws] = partner
                    pairs[partner] = ws

                    await ws.send_text(json.dumps({"type": "status", "data": "connected"}))
                    await partner.send_text(json.dumps({"type": "status", "data": "connected"}))
                    await broadcast_count()

            elif msg_type == "message":
                if ws in pairs:
                    partner = pairs[ws]
                    await partner.send_text(json.dumps({"type": "message", "data": data["data"]}))
                else:
                    await ws.send_text(json.dumps({"type": "error", "data": "Нет собеседника"}))

            elif msg_type == "leave":
                if ws in pairs:
                    partner = pairs.pop(ws)
                    pairs.pop(partner, None)
                    await partner.send_text(json.dumps({"type": "status", "data": "partner_left"}))
                elif waiting == ws:
                    waiting = None
                await ws.send_text(json.dumps({"type": "status", "data": "idle"}))
                await broadcast_count()

    except WebSocketDisconnect:
        active_connections.remove(ws)
        await broadcast_count()

        if ws in pairs:
            partner = pairs.pop(ws)
            pairs.pop(partner, None)
            await partner.send_text(json.dumps({"type": "status", "data": "partner_left"}))
        elif waiting == ws:
            waiting = None


async def broadcast_count():
    count = len(active_connections)
    for conn in active_connections:
        await conn.send_json({"online": count})