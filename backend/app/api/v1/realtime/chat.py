from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from uuid import UUID
from app.api.deps.db import get_db
from app.api.deps.auth import get_current_user 
from app.services.realtime import chat_service
from app.models.rt_message import MessageResponse 


router = APIRouter(tags=["Chat"])

@router.get("/chat/history/{recipient_id}")
def read_chat_history(
    recipient_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Récupère l'historique des messages entre l'utilisateur connecté et le destinataire.
    """
    messages = chat_service.get_chat_history(db, user_id=current_user.id, recipient_id=recipient_id)
    for msg in messages:
        if msg.media:
            print(msg.media.file_path)
    return messages

@router.put("/chat/read/{interlocutor_id}")
def mark_conversaton_as_read(
    interlocutor_id: UUID,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    
    chat_service.mark_conv_as_read(db, user_id=current_user.id, interlocutor_id=interlocutor_id)
    return {'status': 'success'}

@router.get("/chat/recent") 
def get_recent_chats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    return chat_service.get_recent_conversations(db, user_id=current_user.id)


@router.get("/chat/unread-total")
def get_total_unread(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    count = chat_service.total_unread(db, user_id=current_user.id)
    return {"total": count}


    