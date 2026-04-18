from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.models.room import RoomResponse
from app.dependencies import get_room_service, get_current_user
from app.db.schemas.user import User
from app.db.schemas.room import Room


router = APIRouter(prefix="/rooms", tags=["Room"])


@router.get("/me")
def get_room(
    current_user: User = Depends(get_current_user),
    room_service: Room = Depends(get_room_service)
):
    
    room = room_service.get_user_room(current_user.user_room_id)


    return room
    