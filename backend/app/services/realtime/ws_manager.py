from uuid import UUID

from fastapi import WebSocket
from fastapi.encoders import jsonable_encoder


class ConnexionManager:

    def __init__(self):
        self.active_connections: dict[UUID, WebSocket] = {}
    
    async def connect(self, user_id: UUID, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[user_id] = websocket
        
    
    def disconnect(self, user_id: UUID):
        self.active_connections.pop(user_id, None)

    async def send_personal_notification(self, data):
        print("active_connections:", self.active_connections)  # qui est connecté ?
        print("data reçue:", data)  # quelle structure ?
        recipient_id = data.get("recipient").get("id")
        print("recipient_id cherché:", recipient_id)
        websocket = self.active_connections.get(UUID(recipient_id))
        print("ws: ", websocket)
        if websocket:
            await websocket.send_json(jsonable_encoder(data))
    
    async def send_message(self, recipient_id: UUID, data):
        print("active_connections:", self.active_connections)  # qui est connecté ?
        print("data reçue:", data)  # quelle structure ?
        print("recipient_id cherché:", recipient_id)
        websocket = self.active_connections.get(recipient_id)
        print("ws: ", websocket)
        if websocket:
            await websocket.send_json(jsonable_encoder(data))
    
    async def broadcast(self, data):
        for websocket in self.active_connections.values():
            print("message envoyé à: ", websocket)
            await websocket.send_json(jsonable_encoder(data))

ws_manager = ConnexionManager()
