from uuid import UUID
from jose import jwt, JWTError
from fastapi import WebSocket
from app.core.config import settings

async def authenticate_websocket(websocket: WebSocket) -> UUID | None:
    """
    authentification des ws.
    """
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=1008, reason="Token manquant")
        return None
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if not user_id:
            await websocket.close(code=1008, reason="Token invalide")
            return None
        return UUID(user_id)
    except JWTError:
        await websocket.close(code=1008, reason="Token invalide")
        return None