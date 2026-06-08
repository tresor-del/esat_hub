from fastapi import APIRouter, Depends, Body
from pydantic import BaseModel, Field

from app.api.deps.services import get_auth_service, get_room_service
from app.services.auth.users import AuthService
from app.services.social.room import RoomService

router = APIRouter(prefix="/rooms", tags=["Room", "Attendance", "RFID"])

class RFIDScanRequest(BaseModel):
    uid: str 

@router.post("/attendance/rfid-scan")
async def rfid_scan(
    payload: RFIDScanRequest = Body(..., description="Données envoyées par le boîtier RFID"), 
    service: RoomService = Depends(get_room_service),
    user_service: AuthService = Depends(get_auth_service)
):
    
    user = user_service.get_user_by_rfid_uid(payload.uid)

    return await service.mark_present_via_rfid(
        rfid_uid=payload.uid, 
        room_id=user.user_room_id
    )
