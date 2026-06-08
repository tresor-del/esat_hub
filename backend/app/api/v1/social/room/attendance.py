from typing import Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.api.deps.services import get_auth_service, get_room_service
from app.api.deps.auth import get_current_user
from app.db.schemas.user import User
from app.services.social.room import RoomService
from app.models.media import MediaCreate, MediaListResponse, MediaResponse, MediaUpdate
from app.services.common.files import FileService
from app.tasks.room import handle_room_notifications
from app.models.room import CourseSessionResponse
from app.services.auth.users import AuthService


router = APIRouter(prefix="/rooms", tags=["Room", "Attendance"])

@router.get("/attendance/course-session")
def get_active_session(
    user=Depends(get_current_user),
    service: RoomService = Depends(get_room_service)
): 
    session = service.get_session(user)

    return CourseSessionResponse.model_validate(session) if session else None

@router.get("/attendance/sessions/{session_id}/records")
def get_records(
    session_id: str, 
    rep=Depends(get_current_user), 
    service: RoomService = Depends(get_room_service)
):
    return service.get_session_records(session_id, rep_id=rep.id)


@router.post("/attendance/scan")
async def scan(
    token: str, 
    student=Depends(get_current_user), 
    service: RoomService = Depends(get_room_service)
):
    return await service.mark_present(token=token, student_id=str(student.id))


@router.post("/attendance")
def create_session(
    course: str, 
    rep=Depends(get_current_user), 
    service: RoomService = Depends(get_room_service)
):
    return service.create_session(rep=rep, course=course)

@router.get("/attendance/{session_id}/qr")
def get_qr(
    session_id: str, 
    rep=Depends(get_current_user), 
    service: RoomService = Depends(get_room_service)
):
    return service.get_qr(session_id, rep_id=rep.id)


@router.patch("/attendance/{session_id}/close")
def close_session(
    session_id: str, 
    rep=Depends(get_current_user), 
    service: RoomService = Depends(get_room_service)
):
    return service.close_session(session_id, rep_id=rep.id)

@router.get("/attendance/history")
def get_history(
    rep=Depends(get_current_user),
    service: RoomService = Depends(get_room_service)
):
    if not rep.is_room_rep:
        raise HTTPException(403, "Accès réservé au responsable")
    return service.get_session_history(rep_id=str(rep.id))