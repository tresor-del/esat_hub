import asyncio
import logging
from functools import partial
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status, Query
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_teacher
from app.api.deps.db import get_db
from app.db.schemas.user import User
from app.models.assignment import AssignmentCreate, AssignmentResponse, AssignmentUpdate
from app.services.teachers.assignments import (
    create_assignment,
    update_assignment, 
    upload_asnmt_media,
    get_teacher_asnmts_by_room,
)
from app.db.schemas.assignment import AssignmentStatus
from app.models.media import MediaCreate
from app.services.common.files import FileService
from app.tasks.room import handle_room_notifications


router = APIRouter(prefix="/assignments")

logger = logging.getLogger(__name__)

@router.post("/", response_model=AssignmentResponse)
async def create_asgnmt(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: str = Form(...),
    room_id: UUID = Form(...),
    due_date: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher)
):
    
    # créer le devoir
    data = AssignmentCreate(
        title=title,
        description=description,
        room_id=room_id,
        subject=teacher.subject,
        due_date=due_date,
    )
    res = create_assignment(db=db, asnmt_data=data, teacher_id=teacher.id)
    
    # Envoyer le fichiers dans un autre thread pool
    if files:
        for file in files:
            file_service = FileService()
            file_path, original_filename = await asyncio.to_thread(
                partial(
                    file_service.save_upload_file,
                    upload_file=file,
                    is_room_file=True,
                    room_id=data.room_id
                )
            )
            
            if not file_path or not original_filename:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Fichier non supporté"
                )

            mime_type = file.content_type
            media_data = MediaCreate(
                title=title,
                file_path=file_path,
                file_name=original_filename,
                mime_type=mime_type,
                user_id=teacher.id,
                room_id=data.room_id,
                assignment_id=res.id
            )

            media = upload_asnmt_media(db=db, data=media_data)
            
    # envoyer des notifications à tout le monde dans la classe
    background_tasks.add_task(
        handle_room_notifications,
        teacher,
        "new_asnmt_in_room"
    )

    return res

@router.patch("/{asnmt_id}", response_model=AssignmentResponse)
def update_asnmt(
    asnmt_id: UUID,
    payload: AssignmentUpdate,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher)
):
    asnmt = update_assignment(db=db, asnmt_id=asnmt_id, new_data=payload)
    
    return asnmt

@router.get("/{room_id}", response_model=List[AssignmentResponse])
def get_room_asnmt(
    room_id: UUID,
    asnmt_status: Optional[AssignmentStatus] = None,
    db: Session = Depends(get_db),
    teacher: User = Depends(get_current_teacher)
):
    res = get_teacher_asnmts_by_room(
        db=db,
        teacher_id=teacher.id,
        room_id=room_id,
        asnmt_status=asnmt_status
    )
    return res