from sqlalchemy import case, desc, func, select, or_, and_
from sqlalchemy.orm import Session
from app.models.rt_message import MessageCreate
from uuid import UUID

from app.db.schemas.message import Message
from app.db.schemas.user import User

def save_message(db: Session, sender_id: UUID, message_data: MessageCreate):
    db_message = Message(
        sender_id=sender_id,
        recipient_id=message_data.recipient_id,
        content=message_data.message
    )
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    return db_message

def get_chat_history(db: Session, user_id: UUID, recipient_id: UUID, limit: int = 50):
    stmt = select(Message).where(
        or_(
            and_(Message.sender_id == user_id, Message.recipient_id == recipient_id),
            and_(Message.sender_id == recipient_id, Message.recipient_id == user_id)
        )
    ).order_by(Message.timestamp.asc()).limit(limit)
    
    result = db.execute(stmt)
    return result.scalars().all()

def get_recent_conversations(db: Session, user_id: UUID):
    # 1. Sous-requête pour compter les non-lus par expéditeur
    unread_counts_sub = db.query(
        Message.sender_id,
        func.count(Message.id).label("count")
    ).filter(
        Message.recipient_id == user_id,
        Message.is_read == False
    ).group_by(Message.sender_id).subquery()

    # 2. Sous-requête pour le dernier message
    last_msg_subquery = db.query(
        func.max(Message.timestamp).label("max_time"),
        case(
            (Message.sender_id == user_id, Message.recipient_id),
            else_=Message.sender_id
        ).label("interlocutor_id")
    ).filter(
        or_(Message.sender_id == user_id, Message.recipient_id == user_id)
    ).group_by("interlocutor_id").subquery()

    # 3. Requête principale avec jointure sur les deux sous-requêtes
    results = db.query(
        User,
        Message.content,
        Message.timestamp,
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

    # 4. On retourne des types Python simples (évite la RecursionError)
    return [
        {
            "id": str(u.id),
            "profil_name": u.profil_name,
            "avatar_url": u.avatar_path,
            "last_message_content": content,
            "last_message_timestamp": timestamp.isoformat(),
            "unread_count": unread_count # C'est maintenant un entier (int)
        } for u, content, timestamp, unread_count in results
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
