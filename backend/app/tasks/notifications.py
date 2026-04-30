from uuid import UUID

from app.db.database import SessionLocal
from app.services.interactions.notification import NotificationService
from app.db.schemas.user import User
from app.models.user import UserInDatabase, UserResponse
from app.models.notifications import NotificationResponse


def send_notification_task(data: NotificationResponse):
    with SessionLocal() as db: 
        service = NotificationService(db)
        service.send_notification(data)

def send_bulk_notifications_task(
        notification_type: str,
        content: str,
        recipients: list,
        sender: UserResponse | None = None,
        post_id: int | None = None,
        comment_id: UUID | None = None,
):
    with SessionLocal() as db:
        service = NotificationService(db)
        service.send_bulk_notifications(
            notification_type=notification_type,
            content=content,
            recipients=recipients,
            sender=sender,
            post_id=post_id,
            comment_id=comment_id,
        )