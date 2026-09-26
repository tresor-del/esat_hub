import asyncio
import datetime
from functools import partial
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_user
from app.db.schemas.user import User
from app.api.deps.services import get_room_service
from app.models.assignment import AssignmentResponse, SubmissionCreate, SubmissionResponse
from app.services.social.room import RoomService
from app.api.deps.db import get_db
from app.models.media import MediaCreate
from app.services.common.files import FileService
from app.services.teachers.assignments import upload_asnmt_media


router = APIRouter(prefix="/rooms/assignments")

@router.get("/", response_model=List[AssignmentResponse])
def get_asgnmts(
    user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service)
):
    if not user.user_room_id:
        raise HTTPException(
            staus_code=status.HTTP_403_FORBIDDEN,
            detail="User non associé à aucune classe"
        )
        
    asnmts = room_service.get_assignments(current_user=user)
    
    return asnmts

@router.post("/", response_model=SubmissionResponse)
async def create_asnmt(
    assignment_id: UUID = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service),
    db: Session = Depends(get_db)
):
    
    # traitements des fichiers:
    if files:
        for file in files:
            file_service = FileService()
            file_path, original_filename = await asyncio.to_thread(
                partial(
                    file_service.save_upload_file,
                    upload_file=file,
                    is_room_file=True,
                    room_id=user.user_room_id
                )
            )
            
            if not file_path or not original_filename:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Fichier non supporté"
                )

            # envoyer le devoir.
            submission_data = SubmissionCreate(
                assignment_id=assignment_id,
                student_id=user.id
            )
            
            submission = room_service.create_asnmt(data=submission_data, current_user=user)
            
            
            mime_type = file.content_type
            media_data = MediaCreate(
                title="Assignment file",
                file_path=file_path,
                file_name=original_filename,
                mime_type=mime_type,
                user_id=user.id,
                room_id=user.user_room_id,
                assignment_id=assignment_id,
                submission_id=submission.id,
            )

            _ = upload_asnmt_media(db=db, data=media_data)

    return submission