from uuid import UUID

from app.db.database import SessionLocal
from app.core.notifications import notification_contents
from app.db.schemas.user import User
from app.db.schemas.comments import Comment
from app.db.schemas.post import Post
from app.services.interactions.notification import NotificationService
from app.models.notifications import NotificationResponse
from app.models.user import UserResponse
from app.services.realtime.ws_manager import ws_manager

async def handle_new_comment_task(comment_id: UUID, sender_id: UUID):

    with SessionLocal() as db:

        comment = db.query(Comment).get(comment_id)
        sender = db.query(User).get(sender_id)
        post = db.query(Post).get(comment.post_id)
        
        notif_service = NotificationService(db)
        
        if comment.parent_id is None:
            recipient_id = post.user_id
            is_reply = False
        else:
            parent_comment = db.query(Comment).get(comment.parent_id)
            recipient_id = parent_comment.user_id
            is_reply = True

        # if recipient_id == sender_id:
        #     return

        content = notification_contents.new_comment(
            username=sender.username,
            post_title=post.title,
            comment_preview=comment.content[:50],
            is_reply=is_reply
        )

        recipient = db.query(User).get(recipient_id)
        
        notif_data = NotificationResponse(
            type="new_comment",
            content=content,
            is_read=False,
            recipient=UserResponse.model_validate(recipient),
            sender=UserResponse.model_validate(sender),
            post_id=post.id,
            comment_id=comment.id
        )

        await notif_service.send_notification(notif_data)
        await ws_manager.broadcast(notif_data.model_dump(mode="json"))
        
