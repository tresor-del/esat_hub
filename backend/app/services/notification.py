from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.schemas.notification import Notification
from app.models.notifications import NotificationResponse, NotificationListResponse, NotificationResponseUser
from app.models.user import UserResponse
from app.services.ws_manager import ws_manager


class NotificationService:

    def __init__(self, db: Session):
        self._db = db
    
    async def send_notification(self, data: NotificationResponse) -> None:
        try:
            print(f"🔔 Création notification pour {data.recipient.id}: {data.content}")
            
            d_data = data.model_copy()
            validate_data = d_data.model_dump(exclude={"sender", "recipient"})
            validate_data.update({
                "recipient_id": d_data.recipient.id,
                "sender_id": d_data.sender.id if d_data.sender else None
            })
            data_in_db = Notification(**validate_data)
            self._db.add(data_in_db)
            self._db.commit()
            self._db.refresh(data_in_db)
            notif_data = NotificationResponseUser.model_validate(data_in_db).model_dump(mode="json")
            print(f"💾 Notification enregistrée en base: {data_in_db.id}")
            await ws_manager.send_personal_notification(notif_data)
            print("notification envoyyé au manager")
            

        except Exception as e:
            # On log l'erreur mais on ne bloque pas la réponse API
            # La notification n'est pas critiquement bloquante
            print(f"Échec de l'envoi de la notification : {e}")

    async def send_bulk_notifications(
        self,
        notification_type: str,
        content: str,
        recipients: list,
        sender: UserResponse | None = None,
        post_id: int | None = None,
        comment_id: UUID | None = None,
    ) -> None:
        """Envoie une notification à plusieurs destinataires."""
        print(f"📢 Envoi de notifications en bulk: {notification_type} à {len(recipients)} destinataires")
        for recipient in recipients:
            print(f"👤 Destinataire: {recipient.id}")
            if sender and recipient.id == sender.id:
                print(f"⏭️  Saut de l'expéditeur {recipient.id}")
                continue
            print(f"📤 Envoi à {recipient.id}")
            try:
                recipient_data = UserResponse.model_validate(recipient)
                notification = NotificationResponse(
                    type=notification_type,
                    content=content,
                    is_read=False,
                    recipient=recipient_data,
                    sender=sender,
                    post_id=post_id,
                    comment_id=comment_id,
                )
                await self.send_notification(notification)
                print(f"✅ Notification envoyée à {recipient.id}")
            except Exception as e:
                print(f"❌ Erreur envoi notification à {recipient.id}: {e}")

    def get_notification(self, notif_id: UUID) -> Notification | None:
        notification = self._db.query(Notification).where(Notification.id==notif_id).first()
        return notification
    
    def get_notifications(self, user_id: UUID) -> List[Notification]:
        notifications = self._db.query(Notification).where(Notification.recipient_id==user_id).all()
        return notifications

    def is_notification_for_user(self, user_id: UUID, notif_id: UUID) -> bool:
        notification = self.get_notification(notif_id)
        is_for_user = notification.recipient_id == user_id
        return is_for_user

    def get_all_notifications(self, user_id: UUID) -> NotificationListResponse:
        notifications = self.get_notifications(user_id)
        total = len(notifications)
        return NotificationListResponse(total=total, notifications=notifications)
    
    def delete_notification(self, notif_id: UUID) -> None:
        notification = self.get_notification(notif_id)
        self._db.delete(notification)
        self._db.commit()
    
    def delete_all_notification(self, user_id: UUID) -> None:
        self._db.query(Notification).where(Notification.recipient_id==user_id).delete()
        self._db.commit()
    
    def mark_notification_as_read(self, notif_id: UUID) -> None:
        notification = self.get_notification(notif_id)
        notification.is_read = True
        self._db.commit()

    def mark_all_notifications_as_read(self, user_id: UUID) -> None:
        notifications = self.get_notifications(user_id)
        for n in notifications:
            n.is_read = True
            self._db.commit()
