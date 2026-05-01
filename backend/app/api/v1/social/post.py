import logging
from uuid import UUID
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Optional

from app.api.deps.auth import get_current_user
from app.api.deps.services import get_post_service, get_file_service, get_auth_service
from app.api.deps.db import get_db
from app.models.post import PostResponse, PostListResponse, PostType
from app.services.common.files import FileService  
from app.db.schemas.user import User
from app.services.social.posts import PostService
from app.services.auth.users import AuthService
from app.models.user import UserResponse
from app.core.config import settings
from app.tasks.posts import handle_new_post


logger = logging.getLogger(__name__)

router = APIRouter(tags=["posts"])

settings.UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/posts/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
def create_post(
    background_tasks: BackgroundTasks,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    post_type: PostType = Form(...),
    room_id: Optional[UUID] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
    file_service: FileService = Depends(get_file_service)
):
    """Créer un nouveau post avec fichier"""
    try:
        file_path, original_filename = file_service.save_upload_file(
            upload_file=file,
            post_type=post_type.value
        )

        if not file_path and not original_filename:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Fichier non supporté pour le type de post"
            )
        
        # Validation de room_id
        if room_id is not None:
            if current_user.user_room_id != room_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Vous n'avez pas le droit de poster dans cette salle"
                )
        
        post = post_service.create_post(
            title=title,
            description=description,
            post_type=post_type.value,
            file_path=file_path,
            file_name=original_filename,
            mime_type=file.content_type,
            user_id=current_user.id,
            room_id=room_id
        )

        background_tasks.add_task(
            handle_new_post,
            current_user,
            room_id,
            post
        )
        
        return post
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du post: {str(e)}"
        )

@router.get("/posts/", response_model=PostListResponse)
def read_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    post_type: Optional[PostType] = None,
    my_posts: bool = Query(False),
    id: Optional[UUID] = None,
    room_id: Optional[UUID] = None,
    all_posts: bool = Query(False, description="Inclure tous les posts (general + private)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service)
):
    """Récupérer la liste des posts"""
    target_user_id = None
    
    if my_posts:
        target_user_id = current_user.id
    elif id:
        target_user_id = id
        
    posts, total = post_service.get_posts(
        skip=skip,
        limit=limit,
        post_type=post_type.value if post_type else None,
        user_id=target_user_id,
        room_id=room_id,
        include_all=all_posts
    )
    
    return PostListResponse(total=total, posts=posts)

@router.get("/posts/{post_id}", response_model=PostResponse)
def read_post(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service)
):
    """Récupérer un post spécifique"""
    db_post = post_service.get_post(post_id=post_id, current_user_id=current_user.id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post non trouvé"
        )
    
    return db_post

@router.put("/posts/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: int,
    title: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    post_type: Optional[PostType] = Form(None),
    file: Optional[UploadFile] = File(None),
    remove_file: bool = Form(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
    file_service: FileService = Depends(get_file_service)
):


    # Vérifier que le post existe et appartient à l'utilisateur
    db_post = post_service.get_post(post_id=post_id)

    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post non trouvé"
        )
    
    if db_post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de modifier ce post"
        )
    
    try:
        # Gérer le fichier
        new_file_path = None
        new_file_name = None
        new_mime_type = None
        
        if file:
            # Nouveau fichier uploadé
            # Supprimer l'ancien fichier
            
            file_service.delete_file_path(db_post.file_path)

            #Sauvegarder le nouveau fichier
            file_type = post_type.value if post_type else db_post.post_type
            new_file_path, new_file_name = file_service.save_upload_file(
                 upload_file=file,
                 post_type=file_type
             )
            
            new_mime_type = file.content_type
        
        elif remove_file:
             # Supprimer le fichier existant
             file_service.delete_file_path(db_post.file_path)
    
        # Mettre à jour le post
        db_post = post_service.update_post(
            post_id=post_id,
            title=title,
            description=description,
            post_type=post_type.value if post_type else None,
            file_path=new_file_path,
            file_name=new_file_name,
            mime_type=new_mime_type
        )
        
        return db_post
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la modification: {str(e)}"
        )

    
@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    post_service: PostService = Depends(get_post_service),
    file_service: FileService = Depends(get_file_service)
):
    """Supprimer un post"""
    db_post = post_service.get_post(post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post non trouvé"
        )
    
    if db_post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer ce post"
        )
    
    # Supprimer le fichier
    try:
        file_service.delete_file_path(db_post.file_path)
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du fichier: {e}")
    
    # Supprimer de la BDD
    post_service.delete_post(post_id=post_id)
