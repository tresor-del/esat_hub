from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request, status

from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.api.deps.services import get_notification_service
from app.db.schemas.user import User
from app.services.interactions.notification import NotificationService
from app.models.message import Message
from app.api.deps.db import get_db
from app.db.schemas.user_device import UserDevice
from app.models.user_device import DeviceRegistration


router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.post("/register", status_code=status.HTTP_200_OK)
async def register_device(request: Request, payload: DeviceRegistration, db: Session = Depends(get_db)):
    body = await request.body()
    print(f"--- CORPS BRUT REÇU DE KODULAR : {body.decode('utf-8')} ---")
    
    
    try:
        # On cherche si cet appareil existe déjà
        existing_device = db.query(UserDevice).filter(UserDevice.device_token == payload.device_token).first()
        
        if existing_device:
            # Si l'appareil existe déjà, on met juste à jour l'utilisateur (Pas de message de bienvenue)
            existing_device.user_id = payload.user_id
            db.commit()
            print(f"Jeton mis à jour pour l'utilisateur : {payload.user_id}")
        else:
            # C'EST UN NOUVEL APPAREIL : On l'enregistre et on l'accueille !
            new_device = UserDevice(
                user_id=payload.user_id,
                device_token=payload.device_token
            )
            db.add(new_device)
            db.commit() # On commit d'abord pour valider l'enregistrement
            print(f"Nouvel appareil enregistré pour l'utilisateur : {payload.user_id}")
            
        return {"status": "success", "message": "Appareil synchronisé avec succès"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de l'enregistrement de l'appareil : {str(e)}"
        )


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
