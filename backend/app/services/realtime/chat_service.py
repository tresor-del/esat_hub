from sqlalchemy import case, desc, func, select, or_, and_
from sqlalchemy.orm import Session, selectinload
from app.models.rt_message import MessageCreate
from uuid import UUID

from app.db.schemas.message import Message
from app.db.schemas.user import User

import logging

from app.models.notifications import NotificationResponse
from app.services.realtime.ws_manager import ws_manager
from app.services.realtime.utils import encrypt, decrypt
from app.services.admin.manager import AdminService
from app.db.schemas.media import Media
from app.services.interactions.notification import NotificationService

logger = logging.getLogger(__name__)

async def handle_chat_message(
    db: Session,
    user_id: UUID,
    msg_json: dict,
    notif_service: NotificationService,
    admin_service: AdminService
):
    msg_in = MessageCreate(**msg_json)
    saved_msg = save_message(db, user_id, msg_in)
    sender = admin_service.users.get_user_by_id(user_id)

    # Envoi WebSocket temps réel
    await ws_manager.send_message(
        recipient_id=msg_in.recipient_id,
        data={
            "sender": admin_service.users.create_user_response(sender),
            "from": "chat",
            "content": decrypt(saved_msg.content),
            "timestamp": str(saved_msg.timestamp),
            "is_read": saved_msg.is_read,
            "media": {
                "id": str(saved_msg.media.id),
                "file_path": saved_msg.media.file_path,
                "mime_type": saved_msg.media.mime_type,
            } if saved_msg.media else None,
        }
    )

    # Notification FCM
    try:
        recip = admin_service.users.get_user_by_id(msg_in.recipient_id)

        await notif_service.send_notification(NotificationResponse(
            type="chat",
            title=sender.first_name,
            content=decrypt(saved_msg.content),
            is_read=False,
            recipient=admin_service.users.create_user_response(recip),
            sender=admin_service.users.create_user_response(sender),
            comment_id=None
        ))
    except Exception:
        # La notif FCM ne doit pas faire planter le chat donc on fait juste un logger.error pour sentry
        logger.error("Échec FCM pour message %s → %s", user_id, msg_in.recipient_id, exc_info=True)
        
def save_message(db: Session, sender_id: UUID, message_data: MessageCreate):
    db_message = Message(
        sender_id=sender_id,
        recipient_id=message_data.recipient_id,
        media_id=message_data.media_id,
        content=encrypt(message_data.message)
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message


def get_chat_history(db: Session, user_id: UUID, recipient_id: UUID, limit: int = 50, before: datetime | None = None):
    conditions = [
        or_(
            and_(Message.sender_id == user_id, Message.recipient_id == recipient_id),
            and_(Message.sender_id == recipient_id, Message.recipient_id == user_id)
        )
    ]
    if before:
        conditions.append(Message.timestamp < before)

    stmt = (
        select(Message)
        .where(and_(*conditions))
        .order_by(Message.timestamp.desc())
        .limit(limit)
    )
    messages = db.execute(stmt).scalars().all()
    messages = list(reversed(messages))

    for msg in messages:
        if msg.content:
            msg.content = decrypt(msg.content)
    return messages


def get_recent_conversations(db: Session, user_id: UUID):
    
    # Sous-requête pour compter les non-lus par expéditeur
    unread_counts_sub = db.query(
        Message.sender_id,
        func.count(Message.id).label("count")
    ).filter(
        Message.recipient_id == user_id,
        Message.is_read == False
    ).group_by(Message.sender_id).subquery()

    # Sous-requête pour le dernier message
    last_msg_subquery = db.query(
        func.max(Message.timestamp).label("max_time"),
        case(
            (Message.sender_id == user_id, Message.recipient_id),
            else_=Message.sender_id
        ).label("interlocutor_id")
    ).filter(
        or_(Message.sender_id == user_id, Message.recipient_id == user_id)
    ).group_by("interlocutor_id").subquery()

    # Requête principale avec jointure sur les deux sous-requêtes
    results = db.query(
        User,
        Message.content,
        Message.timestamp,
        Message.sender_id,
        func.coalesce(unread_counts_sub.c.count, 0).label("unread_count") # Récupère le chiffre ou 0
    ).join(
        last_msg_subquery, 
        User.id == last_msg_subquery.c.interlocutor_id
    ).join(
        Message,
        (Message.timestamp == last_msg_subquery.c.max_time) & 
        (
            ((Message.sender_id == user_id) & (Message.recipient_id == User.id)) |
            ((Message.sender_id == User.id) & (Message.recipient_id == user_id))
        )
    ).outerjoin( # Utilise outerjoin pour ne pas exclure ceux qui ont 0 non-lus
        unread_counts_sub, 
        User.id == unread_counts_sub.c.sender_id
    ).order_by(desc(Message.timestamp)).all()

    return [
        {
            "user": u,
            "last_message_content": decrypt(content),
            "last_message_timestamp": timestamp.isoformat(),
            "last_sender_id": str(sender_id),
            "unread_count": unread_count 
        } for u, content, timestamp, sender_id, unread_count in results
    ]

def total_unread(db: Session, user_id: UUID):
    count = db.query(func.count(Message.id)).filter(
        Message.recipient_id == user_id,
        Message.is_read == False
    ).scalar()
    return count

def mark_conv_as_read(db: Session, user_id: UUID, interlocutor_id: UUID):
    unread_messages = db.query(Message).filter(
        Message.sender_id == interlocutor_id,
        Message.recipient_id == user_id,
        Message.is_read == False
    ).all()

    for msg in unread_messages:
        msg.is_read = True
    
    db.commit()
    return True

def add_chat_media(db: Session, current_user_id: UUID, file_path: str, file_name: str, mime_type: str ):
    
    media = Media(
        user_id=current_user_id,
        file_path=file_path,
        file_name=file_name,
        mime_type=mime_type,
    )
    db.add(media)
    db.commit()
    db.refresh(media)
    
    return media