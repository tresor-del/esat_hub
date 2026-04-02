from uuid import UUID

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder

from app.db.schemas.notification import Notification

class ConnexionManager:

    def __init__(self):
        self.active_connections: dict[UUID, WebSocket] = {}
    
    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: UUID):
        self.active_connections.pop(user_id, None)

    async def send_personal_notification(self, data: Notification):
        print("id: ", data.recipient_id)
        websocket = self.active_connections.get(data.recipient_id)
        print("ws: ", websocket)
        if websocket:
            print("envoyé")
            await websocket.send_json(jsonable_encoder(data))

ws_manager = ConnexionManager()
