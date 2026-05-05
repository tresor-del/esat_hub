from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps.db import get_db
from app.api.deps.auth import get_current_user # Ton helper d'authentification
from app.services.realtime.chat import get_chat_history, get_recent_conversations
from app.models.rt_message import MessageRead # Ton schéma Pydantic

router = APIRouter(tags=["Chat"])

@router.get("/chat/history/{recipient_id}")
def read_chat_history(
    recipient_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user) # Récupère le user connecté via le Bearer token
):
    """
    Récupère l'historique des messages entre l'utilisateur connecté et le destinataire.
    """
    messages = get_chat_history(db, user_id=current_user.id, recipient_id=recipient_id)
    return messages

@router.get("/chat/recent")  # Utilisez votre schéma d'utilisateur
def get_recent_chats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return get_recent_conversations(db, user_id=current_user.id)

