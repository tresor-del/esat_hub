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
 
from app.models.notifications import NotificationResponse  
from app.models.user import UserResponse
from app.api.deps.services import get_notification_service  

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
                    # Enregistrement du message de chat en base de données
                    saved_msg = save_message(db, user_id, msg_in)
                    
                    # ── EXPÉDITION DU CHAT EN TEMPS RÉEL (WebSocket de chat existant) ──
                    payload_response = {
                        "sender_id": str(user_id),
                        "content": saved_msg.content,
                        "timestamp": str(saved_msg.timestamp),
                        "is_read": saved_msg.is_read,
                    }
                    await ws_manager.send_message(recipient_id=msg_in.recipient_id, data=payload_response)
                    
                    # ── BRANCHEMENT DU SERVICE DE NOTIFICATION POUR LE MOBILE ── 
                    # 1. Initialisation du service avec la session DB actuelle
                    notif_service = get_notification_service()
                    
                    from app.api.deps.services import get_admin_service

                    admin_service = get_admin_service()
                    
                    # 2. Construction du profil minimal du destinataire requis par ton schéma
                    recip = admin_service.get_user_by_id(msg_in.recipient_id)
                    recipient_profile = admin_service.create_user_response(recip)

                    # Construction du profil minimal de l'expéditeur
                    sender_profile = admin_service.create_user_response(admin_service.get_user_by_id(user_id))

                    # 3. Création de l'objet de notification type "chat"
                    notification_payload = NotificationResponse(
                        type="chat",  
                        content=saved_msg.content,  
                        is_read=False,
                        recipient=recipient_profile,
                        sender=sender_profile,
                        post_id=None,
                        comment_id=None
                    )
                    
                    # 4. Envoi au service : il l'enregistre en DB et déclenche l'envoi Firebase Cloud Messaging !
                    await notif_service.send_notification(notification_payload)
                    
                finally:
                    db.close()
                    
    except WebSocketDisconnect:
        ws_manager.disconnect(user_id)
