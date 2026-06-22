import json
import logging
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
from websockets import ConnectionClosedError

from app.services.realtime.ws_manager import ws_manager
from app.api.deps.db import get_db

from app.api.deps.services import get_admin_service, get_notification_service
from app.services.realtime.ws_auth import authenticate_websocket
from app.services.realtime.chat_service import handle_chat_message  

logger = logging.getLogger(__name__)
router = APIRouter(tags=["websocket"])

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    
    user_id = await authenticate_websocket(websocket)
    if not user_id:
        return

    await ws_manager.connect(user_id, websocket)

    db_gen = get_db()
    db = next(db_gen)
    notif_service = get_notification_service(db)
    admin_service = await get_admin_service(db)
    
    try:
        while True:
            data = await websocket.receive_text()

            try:
                msg_json = json.loads(data)
            except json.JSONDecodeError:
                logger.warning("Message JSON invalide de %s", user_id)
                continue

            if "recipient_id" in msg_json:
                await handle_chat_message(db, user_id, msg_json, notif_service, admin_service)

    except (WebSocketDisconnect, ConnectionClosedError):
        pass
    except Exception:
        logger.error("Erreur WS user %s", user_id, exc_info=True)
    finally:
        ws_manager.disconnect(user_id)
        try:
            next(db_gen)
        except StopIteration:
            pass
