from uuid import UUID

from app.tasks.deps import get_tasks_db
from app.db.schemas.user import User
from app.db.schemas.post import Post
from app.services.interactions.notification import NotificationService
from app.models.notifications import NotificationResponse, NotificationUserResponse

async def handle_new_like(post_id: UUID, sender, new):

    with get_tasks_db() as db:

        sender = sender
        post = db.query(Post).get(post_id)
        
        notif_service = NotificationService(db)
        
        recipient_id = post.user_id

        recipient = db.query(User).get(recipient_id)
        
        if new:
            notif_data = NotificationResponse(
                type="new_like",
                title="Nouveau like" ,
                content=f"Nouveau Like de {sender.profil_name}",
                is_read=False,
                recipient=NotificationUserResponse.model_validate(recipient),
                sender=NotificationUserResponse.model_validate(sender),
                post=post,
            )

            await notif_service.send_notification(notif_data)
        
