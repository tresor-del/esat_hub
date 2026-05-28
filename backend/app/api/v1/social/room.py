from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status

from app.api.deps.services import get_file_service, get_room_service
from app.api.deps.auth import get_current_user
from app.db.schemas.user import User
from app.services.social.room import RoomService
from app.models.media import MediaCreate, MediaListResponse, MediaResponse, MediaUpdate
from app.services.common.files import FileService


router = APIRouter(prefix="/rooms", tags=["Room"])


@router.get("/me")
def get_room(
    current_user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service)
):
    room = room_service.get_user_room(current_user)
    return room


@router.post("/add-media", response_model=MediaResponse)
def upload_room_media(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service),
    file_service: FileService = Depends(get_file_service)
):
    room = room_service.get_user_room(current_user)
    room_id = room.id if room else current_user.user_room_id

    if not room_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Impossible de déterminer la salle de l'utilisateur"
        )

    file_path, original_filename = file_service.save_upload_file(
        upload_file=file,
        is_room_file=True,
        room_id=room_id
    )

    if not file_path and not original_filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Fichier non supporté pour le type de post"
        )

    mime_type = file.content_type
    data = MediaCreate(
        title=title,
        description=description,
        file_path=file_path,
        file_name=original_filename,
        mime_type=mime_type,
        user_id=current_user.id,
        room_id=room_id
    )

    media = room_service.upload_room_media(data)
    return media


@router.get("/media", response_model=MediaListResponse)
def get_room_media(
    current_user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service)
):
    media = room_service.get_room_media(current_user.user_room_id)
    return media


@router.put("/media/{media_id}", response_model=MediaResponse)
def update_room_media(
    media_id: UUID,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    remove_file: bool = Form(False),
    current_user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service),
    file_service: FileService = Depends(get_file_service)
):
    db_media = room_service.get_room_media_by_id(media_id)

    if db_media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Média non trouvé"
        )

    if db_media.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de modifier ce média"
        )

    new_file_path = None
    new_file_name = None
    new_mime_type = None

    if file:
        room = room_service.get_user_room(current_user)
        room_id = room.id if room else current_user.user_room_id

        if not room_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de déterminer la salle de l'utilisateur"
            )

        new_file_path, new_file_name = file_service.save_upload_file(
            upload_file=file,
            is_room_file=True,
            room_id=room_id
        )

        if not new_file_path and not new_file_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fichier non supporté pour le type de post"
            )

        if db_media.file_path:
            file_service.delete_file_path(db_media.file_path)

        new_mime_type = file.content_type
    elif remove_file:
        if db_media.file_path:
            file_service.delete_file_path(db_media.file_path)

        new_file_path = None
        new_file_name = None
        new_mime_type = None

    update_data = MediaUpdate(
        title=title,
        description=description,
        file_path=new_file_path,
        file_name=new_file_name,
        mime_type=new_mime_type,
    )

    updated_media = room_service.update_room_media(media_id, update_data)
    return updated_media


@router.delete("/media/{media_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_room_media(
    media_id: UUID,
    current_user: User = Depends(get_current_user),
    room_service: RoomService = Depends(get_room_service),
    file_service: FileService = Depends(get_file_service)
):
    db_media = room_service.get_room_media_by_id(media_id)

    if db_media is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Média non trouvé"
        )

    if db_media.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer ce média"
        )

    if db_media.file_path:
        file_service.delete_file_path(db_media.file_path)

    room_service.delete_room_media(media_id)
