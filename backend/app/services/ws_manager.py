from fastapi import WebSocket

from app.models.notifications import NotificationPayload

class ConnexionManager:

    def __init__(self):
        self.active_connections: dict[str, WebSocket] = {}
    
    async def connect(self, user_id: str, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
    
    def disconnect(self, user_id: str):
        self.active_connections.pop(user_id, None)

    async def send_personal_notification(self, user_id: str, message: NotificationPayload):
        websocket = self.active_connections.get(user_id)
        if websocket:
            await websocket.send_json(message.model_dump(mode="json"))

ws_manager = ConnexionManager()
