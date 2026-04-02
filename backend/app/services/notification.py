from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from app.db.schemas.notification import Notification
from app.models.notifications import NotificationResponse, NotificationListResponse
from app.services.ws_manager import ws_manager


class NotificationService:

    def __init__(self, db: Session):
        self._db = db
    
    async def send_notification(self, data: NotificationResponse) -> None:
        try:
            
            d_data = data.model_copy()
            validate_data = d_data.model_dump()
            validate_data.pop("sender")
            validate_data.pop("recipient")
            validate_data.update({"recipient_id": data.recipient.id})
            validate_data.update({"sender_id": data.sender.id if data.sender else None})
            data_in_db = Notification(**validate_data)
            await ws_manager.send_personal_notification(data_in_db)
            print("notification envoyyé au manager")
            self._db.add(data_in_db)
            self._db.commit()
            self._db.refresh(data_in_db)

        except Exception as e:
            # On log l'erreur mais on ne bloque pas la réponse API
            # Le commentaire est déjà créé en base
            print(f"Échec de l'envoi de la notification : {e}")

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
