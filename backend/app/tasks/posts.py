import logging
from app.models.user import UserResponse
from app.api.deps.services import get_auth_service, get_notification_service
from app.core.notifications import notification_contents
from app.tasks.deps import get_tasks_db
from app.models.notifications import NotificationUserResponse

logger = logging.getLogger(__name__)

async def handle_new_post(current_user, room_id, post):
    try:
        with get_tasks_db() as db:
            auth_service = get_auth_service(db)
            notif_service = get_notification_service(db)
            
        # Préparer l'expéditeur de notification
            sender = NotificationUserResponse(
                id=current_user.id,
                username=getattr(current_user, 'username', None),
                first_name=getattr(current_user, 'first_name', None),
                last_name=getattr(current_user, 'last_name', None),
                user_room_id=getattr(current_user, 'user_room_id', None),
                avatar_path=getattr(current_user, 'avatar_path', None),
                profil_name = getattr(current_user, 'profil_name', None)
            )

            # Préparer le contenu selon si le post est général ou de classe
            
            is_general = room_id is None
            
            if room_id is None:
                recipients = auth_service.get_all_users()
                
            else:
                recipients = auth_service.get_users_by_room_id(room_id)
                

            await notif_service.send_bulk_notifications(
                notification_type="new_post",
                title=f"Nouvelle publication de {post.user.first_name}",
                content=post.title,
                recipients=recipients,
                sender=sender,
                post_id=post.id,
            )
            
    except Exception:
        # Log l'erreur complète côté serveur, rien ne remonte à l'user
        print("error")
        logger.error(
            "Échec notifications pour post %s par user %s",
            post.id, current_user.id,
            exc_info=True  # ← inclut le traceback complet dans Sentry/logs
        )
        
        