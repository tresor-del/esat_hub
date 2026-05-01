from sqlalchemy.orm import Session

from app.db.database import SessionLocal
from app.models.user import UserResponse
from app.api.deps.services import get_auth_service, get_notification_service
from app.core.notifications import notification_contents

async def handle_new_post(current_user, room_id, post):
    with SessionLocal() as db:
        auth_service = get_auth_service(db)
        notif_service = get_notification_service(db)
        
        # Préparer l'expéditeur de notification
        sender = UserResponse(
            id=current_user.id,
            email=current_user.email,
            username=getattr(current_user, 'username', None),
            first_name=getattr(current_user, 'first_name', None),
            last_name=getattr(current_user, 'last_name', None),
            is_verified=getattr(current_user, 'is_verified', False),
            user_room_id=getattr(current_user, 'user_room_id', None)
        )

        # Préparer le contenu selon si le post est général ou de classe
        if room_id is None:
            recipients = auth_service.get_all_users()
            notif_content = notification_contents.new_post(
                username=current_user.username,
                post_title=post.title,
                is_general=True
            )
            
        else:
            recipients = auth_service.get_users_by_room_id(room_id)
            notif_content = notification_contents.new_post(
                username=current_user.username,
                post_title=post.title,
                is_general=True
            )
            

        await notif_service.send_bulk_notifications(
            notification_type="new_post",
            content=notif_content,
            recipients=recipients,
            sender=sender,
            post_id=post.id,
        )