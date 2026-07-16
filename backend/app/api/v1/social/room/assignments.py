import datetime
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.deps.auth import get_current_user
from app.db.schemas.user import User
from app.api.deps.services import get_room_service
from app.models.assignment import AssignmentResponse
from app.services.social.room import RoomService


router = APIRouter(prefix="/rooms/assignments")

@router.get("/", response_model=List[AssignmentResponse])
def get_asgnmts(
    user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service)
):
    asnmts = room_service.get_assignments(current_user=user)
    
    return asnmts
