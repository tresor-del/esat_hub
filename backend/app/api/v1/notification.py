from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.dependencies import get_current_user, get_notification_service
from app.db.schemas.user import User
from app.services.notification import NotificationService
from app.models.message import Message


router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/me/all")
def get_all_notifications(
    current_user: User = Depends(get_current_user),
    notif_service: NotificationService = Depends(get_notification_service)
):
    notifications = notif_service.get_all_notifications(current_user.id)
    return notifications

@router.delete("/me/delete/{notif_id}")
def delete_notification(
    notif_id: UUID,
    current_user: User = Depends(get_current_user),
    notif_service: NotificationService = Depends(get_notification_service)

):
    notification = notif_service.get_notification(notif_id=notif_id)
    if notification is None:
        raise HTTPException(404, detail="Not found")

    is_for_user = notif_service.is_notification_for_user(current_user.id, notif_id)
    if not is_for_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")

    notif_service.delete_notification(notif_id=notif_id)
    return Message(message="Notification éffacé avec succès")


@router.delete("/me/all")
def delete_all_notifications(
    current_user: User = Depends(get_current_user),
    notif_service: NotificationService = Depends(get_notification_service)
):
    notif_service.delete_all_notification(current_user.id)
    return Message(message="Notifications éffacés avec succès")

@router.put("/me/all")
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    notif_service: NotificationService = Depends(get_notification_service)  
):
    notif_service.mark_all_notifications_as_read(current_user.id)
    return Message(message="Notifications marqués comme lus avec succès")

@router.put("/me/{notif_id}")
def mark_notification_as_read(
    notif_id: UUID,
    current_user: User = Depends(get_current_user),
    notif_service: NotificationService = Depends(get_notification_service)
  
):
    notification = notif_service.get_notification(notif_id=notif_id)
    if notification is None:
        raise HTTPException(404, detail="Not found")

    is_for_user = notif_service.is_notification_for_user(current_user.id, notif_id)
    if not is_for_user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Non autorisé")

    notif_service.mark_notification_as_read(notif_id=notif_id)
    return Message(message="Notification marqué comme lu avec succès")
