from fastapi import WebSocket

from app.metrics import prometheus


class ConnectionManager:
    def __init__(self) -> None:
        self.active: dict[str, WebSocket] = {}

    async def connect(self, session_id: str, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active[session_id] = websocket
        prometheus.ws_connections_active.inc()

    def disconnect(self, session_id: str) -> None:
        if self.active.pop(session_id, None):
            prometheus.ws_connections_active.dec()

    async def send_json_text(self, session_id: str, payload: str) -> None:
        websocket = self.active[session_id]
        await websocket.send_text(payload)


connection_manager = ConnectionManager()
