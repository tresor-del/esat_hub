from pathlib import Path
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.api.deps.auth import get_current_user
from app.api.deps.db import get_db
from app.api.deps.services import get_post_service, get_file_service, get_auth_service
from app.db.schemas.user import User
from app.core.config import settings
from app.services.social.posts import PostService
from app.services.common.files import FileService

router = APIRouter(prefix="/files", tags=["files"])


@router.get("/posts/{post_id}")
def download_file(
    post_id: uuid.UUID, 
    db: Session = Depends(get_db),
    post_service: PostService = Depends(get_post_service),
    file_service: FileService = Depends(get_file_service)
):
    """Télécharger le fichier d'un post"""
    db_post = post_service.get_post(post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post non trouvé"
        )
    
    # if file_service.check_file_exists(db_post.file_path):
    #     raise HTTPException(
    #         status_code=status.HTTP_404_NOT_FOUND,
    #         detail="Fichier non trouvé"
    #     )
    
    return FileResponse(
        path=db_post.file_path,
        filename=db_post.file_name,
        media_type=db_post.mime_type
    )



@router.post("/users/me/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    file_service: FileService = Depends(get_file_service)
):

    # Vérifier le type
    if avatar.content_type not in settings.ALLOWED_TYPES:
        raise HTTPException(400, "Type de fichier non autorisé")
    
    # Lire le contenu
    content = await avatar.read()
    
    # Vérifier la taille
    if len(content) > settings.MAX_SIZE:
        raise HTTPException(400, "Fichier trop volumineux (max 2MB)")
    
    # Redimensionner l'image, retourne des bytes
    image = file_service.resize_image(content)
    
    # Supprimer l'ancien avatar si existe
    if current_user.avatar_path :
        file_service.delete_file_path(current_user.avatar_path)
    
    # Sauvegarder avec un nom unique
    file_path = file_service.save_upload_file(
        resized_file=image,
        resized=True,
        is_avatar=True,
        is_post_file=False
    )[0]

    # Mettre à jour le chemin de l'avatar dans la base de données
    file_service.update_avatar(db, current_user, file_path)

    return {"message": "Avatar mis à jour", "avatar_path": file_path}

@router.get("/users/{user_id}/avatar")
async def get_avatar(
    user_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    file_service: FileService = Depends(get_file_service),
    user_service = Depends(get_auth_service)):
    
    user = user_service.get_user(user_id)
    
    if not user or not user.avatar_path or not file_service.check_file_exists(user.avatar_path):
        # Retourner un avatar par défaut
        # return FileResponse(settings.DEFAULT_AVATAR)
        return None
    
    return FileResponse(user.avatar_path)

@router.post("/chat/upload")
async def upload_chat_file(
    file: UploadFile = File(...),
    file_service: FileService = Depends(get_file_service)
    ):

    file_path, _ = file_service.save_upload_file(
        upload_file=file
    )

    # 3. Renvoyer le chemin relatif
    return {"file_path": file_path}