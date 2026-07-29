from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps.services import get_file_service, get_room_service
from app.api.deps.auth import get_current_user
from app.db.schemas.user import User
from app.services.social.room import RoomService
from app.models.media import MediaCreate, MediaListResponse, MediaResponse, MediaUpdate
from app.services.common.files import FileService
from app.tasks.room import handle_room_notifications


router = APIRouter(prefix="/rooms", tags=["Room"])


@router.get("/me")
def get_room(
    current_user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service)
):
    room = room_service.get_user_room(current_user)
    return room
