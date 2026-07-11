from app.models.user import UserResponse
from app.api.deps.services import get_auth_service, get_notification_service
from app.tasks.deps import get_tasks_db
from app.models.notifications import NotificationUserResponse

async def handle_room_notifications(current_user, type):
    
    with get_tasks_db() as db:
        
        auth_service = get_auth_service(db)
        notif_service = get_notification_service(db)
        
        # Préparer l'expéditeur de notification
        sender = NotificationUserResponse.model_validate(current_user)

        # recevoir les membres de la classes
        recipients = auth_service.get_users_by_room_id(current_user.user_room_id)

        # contenu de la notification
        if type == "new_media_in_room":
            notif_content = f"{sender.profil_name} a ajouté un fichier dans votre salle"

        await notif_service.send_bulk_notifications(
            notification_type=type,
            content=notif_content,
            recipients=recipients,
            sender=sender,
            title="Nouveau Fichier"
        )