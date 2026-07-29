from uuid import UUID

from app.services.interactions.notification import NotificationService
from app.models.user import UserInDatabase, UserResponse
from app.models.notifications import NotificationResponse
from app.tasks.deps import get_tasks_db


async def send_notification_task(data: NotificationResponse):
    with get_tasks_db() as db:
        service = NotificationService(db)
        await service.send_notification(data)

async def send_bulk_notifications_task(
        notification_type: str,
        content: str,
        recipients: list,
        sender: UserResponse | None = None,
        post_id: int | None = None,
        comment_id: UUID | None = None,
):
    with get_tasks_db() as db:
        service = NotificationService(db)
        await service.send_bulk_notifications(
            notification_type=notification_type,
            content=content,
            recipients=recipients,
            sender=sender,
            post_id=post_id,
            comment_id=comment_id,
        )