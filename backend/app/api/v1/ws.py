import asyncio
from uuid import UUID
from jose import jwt, JWTError
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.models.notifications import NotificationPayload
from app.core.config import settings
from app.services.ws_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    token = websocket.query_params.get("token")

    if not token:
        await websocket.close(code=1008, reason="token query parameter is required")
        return
    
    try:
        payload = jwt.decode(
            token=token,
            key=settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
        
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return
    
    await ws_manager.connect(user_id, websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)


# # Dans ton fichier ws.py
# @router.websocket("/ws")  # ou "" selon ta config
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept() # On accepte direct sans vérifier le token
#     await websocket.send_json({"msg": "Connecté !"})
#     await websocket.close()
