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
    # On récupère les IDs des gens à qui on a parlé ou qui nous ont parlé
    subquery = db.query(
        func.max(Message.timestamp).label("last_msg_time"),
        case(
            (Message.sender_id == user_id, Message.recipient_id),
            else_=Message.sender_id
        ).label("interlocutor_id")
    ).filter(
        or_(Message.sender_id == user_id, Message.recipient_id == user_id)
    ).group_by("interlocutor_id").subquery()

    # On fait une jointure pour récupérer les profils de ces utilisateurs
    return db.query(User).join(
        subquery, User.id == subquery.c.interlocutor_id
    ).order_by(desc(subquery.c.last_msg_time)).all()


