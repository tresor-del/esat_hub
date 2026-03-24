import logging
from uuid import UUID
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional

from app.dependencies import get_db, get_current_user, get_file_service, get_post_service
from app.models.post import PostResponse, PostListResponse, PostType
from app.services.files import FileService  
from app.db.schemas.user import User
from app.services.posts import PostService
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter(tags=["posts"])

settings.UPLOAD_DIR.mkdir(exist_ok=True)

@router.post("/posts/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    post_type: PostType = Form(...),
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
        
        db_post = post_service.create_post(
            title=title,
            description=description,
            post_type=post_type.value,
            file_path=file_path,
            file_name=original_filename,
            mime_type=file.content_type,
            user_id=current_user.id
        )
        
        return db_post
    
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
        user_id=target_user_id
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
    
    if db_post.get("user_id") != current_user.id:
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
            
            file_service.delete_file_path(db_post.get("file_path"))

            #Sauvegarder le nouveau fichier
            file_type = post_type.value if post_type else db_post.get("post_type")
            new_file_path, new_file_name = file_service.save_upload_file(
                 upload_file=file,
                 post_type=file_type
             )
            
            new_mime_type = file.content_type
        
        elif remove_file:
             # Supprimer le fichier existant
             file_service.delete_file_path(db_post.get("file_path"))
    
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
    
    if db_post.get("user_id") != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer ce post"
        )
    
    # Supprimer le fichier
    try:
        file_service.delete_file_path(db_post.get("file_path"))
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du fichier: {e}")
    
    # Supprimer de la BDD
    post_service.delete_post(post_id=post_id)
