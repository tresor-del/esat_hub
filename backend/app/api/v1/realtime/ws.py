import json
from uuid import UUID
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.core.config import settings
from app.services.realtime.ws_manager import ws_manager
from app.api.deps.db import get_db
from app.models.rt_message import MessageCreate
from app.services.realtime.chat import save_message

router = APIRouter(tags=["websocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    # 1. Extraction et validation du token
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
        user_id = UUID(payload.get("sub"))
        if not user_id:
            await websocket.close(code=1008, reason="Invalid token")
            return
    except JWTError:
        await websocket.close(code=1008, reason="Invalid token")
        return

    # 2. On accepte la connexion et l'enregistre
    await ws_manager.connect(user_id, websocket)
    
    try:
        while True:
            # 3. Écoute des données entrantes du client
            data = await websocket.receive_text()
            msg_json = json.loads(data)
            print("message: ", msg_json)

            # Si le JSON contient un 'recipient_id', c'est du chat !
            if "recipient_id" in msg_json:
                msg_in = MessageCreate(**msg_json)
                
                
                # Récupération d'une session de DB à la volée
                db = next(get_db())
                try:
                    # Enregistrement en base de données
                    saved_msg = save_message(db, user_id, msg_in)
                    
                    # Préparation de la réponse pour le client
                    payload_response = {
                        "sender_id": str(user_id),
                        "content": saved_msg.content,
                        "timestamp": str(saved_msg.timestamp),
                        "is_read": saved_msg.is_read,
                    }
                    
                    # Envoi ciblé au destinataire s'il est connecté
                    await ws_manager.send_message(recipient_id=msg_in.recipient_id, data=payload_response)
                finally:
                    db.close()
                    
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)
