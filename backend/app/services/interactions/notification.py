import asyncio
from typing import List
from uuid import UUID
from sqlalchemy.orm import Session

from firebase_admin import messaging  
from app.db.schemas.user_device import UserDevice 


from app.db.schemas.notification import Notification
from app.models.notifications import NotificationResponse, NotificationListResponse, NotificationResponseUser
from app.models.user import UserResponse
from app.services.realtime.ws_manager import ws_manager


class NotificationService:

    def __init__(self, db: Session):
        self._db = db

    def send_firebase_push(self, recipient_id: UUID, title: str, body: str) -> None:
        """Méthode interne pour pousser une bannière Android via Firebase Cloud Messaging."""
        try:
            # 1. On cherche UNIQUEMENT les appareils qui ont un token valide, non vide et non nul
            devices = self._db.query(UserDevice).filter(
                UserDevice.user_id == recipient_id,
                UserDevice.device_token != None,
                UserDevice.device_token != ""
            ).all()
            
            print(f"FCM : Nombre d'appareils valides trouvés pour l'envoi : {len(devices)}")
            
            if not devices:
                print("ℹFCM : Aucun appareil avec un jeton valide trouvé en base de données.")
                return
                
            # 2. On envoie la bannière à chaque téléphone trouvé
            for device in devices:
                # Sécurité supplémentaire juste avant la construction du message
                if not device.device_token or device.device_token.strip() == "":
                    print("Sécurité : Jeton vide détecté dans la boucle, ignoré.")
                    continue
                    
                print(f"FCM : Tentative d'envoi au token : {device.device_token[:15]}...")
                
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=title,
                        body=body,
                    ),
                    android=messaging.AndroidConfig(
                        priority="high",  
                        notification=messaging.AndroidNotification(
                            priority="high",  
                            sound="default",  
                        ),
                    ),
                    token=device.device_token,
                )
                
                try:
                    response = messaging.send(message)
                    print(f"FCM : Bannière envoyée avec succès ! ID: {response}")
                except Exception as fcm_err:
                    print(f"FCM : Erreur d'envoi pour le token {device.device_token[:10]}... : {fcm_err}")
                    # Nettoyage automatique de la base si le token n'est plus reconnu par Firebase
                    self._db.delete(device)
                    self._db.commit()
                    
        except Exception as e:
            print(f"Erreur globale lors du traitement FCM : {e}")


    
    async def send_notification(self, data: NotificationResponse) -> None:
        try:

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
            print(f"Notification enregistrée en base: {data_in_db.id}")
            await ws_manager.send_personal_notification(notif_data)
            print("notification envoyé au manager")

            title_mapping = {
                "chat": "Nouveau message",
                "new_comment": "Nouveau commentaire",
                "new_post": "Nouveau post",
                "COMMENTAIRE_SUPPRIMÉ": "Commentaire supprimé",
                "POST_SUPPRIMÉ": "Post supprimé",
                "POST_STATUS_UPDATE": "Status du post mis à jour",
                "ROLE_UPDATE": "Role mis à jour",
                "ACCOUNT_DELETED": "Status mis à jour",
            }

            notif_title = title_mapping.get(data_in_db.type, "Nouvelle notification")
            
            # On déclenche l'envoi Firebase de manière non-bloquante
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(
                None,                    # utilise le thread pool par défaut
                self.send_firebase_push, # la fonction bloquante
                data_in_db.recipient_id, # argument 1
                notif_title,             # argument 2
                data_in_db.content       # argument 3
            )
            

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
        post_id: UUID | None = None,
        comment_id: UUID | None = None,
    ) -> None:
        """Envoie une notification à plusieurs destinataires."""
        print(f"Envoi de notifications en bulk: {notification_type} à {len(recipients)} destinataires")
        for recipient in recipients:
            print(f"Destinataire: {recipient.id}")

            if sender and recipient.id == sender.id:
                continue
            
            print(f"Envoi à {recipient.id}")
            try:
                recipient_data = UserResponse(
                    first_name=recipient.first_name,
                    last_name=recipient.last_name,
                    profil_name=recipient.profil_name,
                    school_name=recipient.school_name,
                    domain=recipient.domain,
                    level=recipient.level,
                    year=recipient.year,
                    id=recipient.id,
                    is_verified=recipient.is_verified,
                    username=recipient.username,
                    user_room_id=recipient.user_room_id,
                    email=recipient.email,
                )

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
                print(f"Notification envoyée à {recipient.id}")
            except Exception as e:
                print(f"Erreur envoi notification à {recipient.id}: {e}")

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
