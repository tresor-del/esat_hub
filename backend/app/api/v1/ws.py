import asyncio
from uuid import UUID
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.notifications import NotificationPayload

router = APIRouter(prefix="/ws", tags=["websocket"])

class ConnexionManager:

    def __init__(self):
        self.active_connections: dict[UUID, WebSocket] = {}
    
    async def connect(self,user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: UUID):
        self.active_connections.pop(user_id, None)

    async def send_personal_notification(self, user_id: UUID, message: NotificationPayload):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message.model_dump())

manager = ConnexionManager()

@router.websocket("/")
async def websocket_endpoint(websocket: WebSocket):
    user_id_str = websocket.query_params.get("user_id")
    if not user_id_str:
        await websocket.close(code=1008, reason="user_id query parameter is required")
        return
    try:
        user_id = UUID(user_id_str)
    except ValueError:
        await websocket.close(code=1008, reason="Invalid user_id format")
        return
    
    await manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(user_id)
