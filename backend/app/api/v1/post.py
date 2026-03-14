# app/api/v1/post.py (VERSION COMPLÈTE)
import logging
from uuid import UUID
from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import os
from pathlib import Path

from app.dependencies import get_db, get_current_user, get_post_service
from app.models.post import PostResponse, PostUpdate, PostListResponse, PostType
from app.models.like import LikeResponse
from app.models.comment import CommentCreate, CommentUpdate, CommentResponse, CommentListResponse
from app.utils.files import save_upload_file
from app.db.schemas.user import User
from app.services.post_service import PostService
from app.models.message import Message

logger = logging.getLogger(__name__)

router = APIRouter(tags=["posts"])

# Créer le dossier uploads s'il n'existe pas
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Extensions de fichiers autorisées
ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".xlsx", ".xls", ".ppt", ".pptx"}


@router.post("/posts/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    post_type: PostType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PostService = Depends(get_post_service)
):
    """Créer un nouveau post avec fichier"""
    try:
        file_path, original_filename = save_upload_file(
            file, 
            post_type.value,
            ALLOWED_DOCUMENT_EXTENSIONS,
            ALLOWED_PHOTO_EXTENSIONS, 
            UPLOAD_DIR
        )
        
        db_post = service.create_post(
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
    service: PostService = Depends(get_post_service)
):
    """Récupérer la liste des posts"""
    target_user_id = None
    
    if my_posts:
        target_user_id = current_user.id
    elif id:
        target_user_id = id
        
    posts, total = service.get_posts(
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
    service: PostService = Depends(get_post_service)
):
    """Récupérer un post spécifique"""
    db_post = service.get_post(post_id=post_id, current_user_id=current_user.id)
    
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
    service: PostService = Depends(get_post_service)
):


    # Vérifier que le post existe et appartient à l'utilisateur
    db_post = service.get_post(post_id=post_id)
    
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
            if os.path.exists(db_post.get("file_path")):
                 os.remove(db_post.get("file_path"))
            
              #Sauvegarder le nouveau fichier
            file_type = post_type.value if post_type else db_post.get("post_type")
            new_file_path, new_file_name = save_upload_file(
                 file,
                 file_type,
                 ALLOWED_DOCUMENT_EXTENSIONS,
                 ALLOWED_PHOTO_EXTENSIONS,
                 UPLOAD_DIR
             )
            new_mime_type = file.content_type
        
        elif remove_file:
             # Supprimer le fichier existant
             if os.path.exists(db_post.get("file_path")):
                 os.remove(db_post.get("file_path"))
              # Note: Dans ce cas, il faudrait peut-être exiger un nouveau fichier
              # ou changer le type de post en "text"
        
        # Mettre à jour le post
        db_post = service.update_post(
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
    service: PostService = Depends(get_post_service)
):
    """Supprimer un post"""
    db_post = service.get_post(post_id=post_id)
    
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
        if os.path.exists(db_post.get("file_path")):
            os.remove(db_post.get("file_path"))
    except Exception as e:
        logger.error(f"Erreur lors de la suppression du fichier: {e}")
    
    # Supprimer de la BDD
    service.delete_post(post_id=post_id)


@router.get("/posts/{post_id}/file")
def download_file(
    post_id: int, 
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service)
):
    """Télécharger le fichier d'un post"""
    db_post = service.get_post(post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post non trouvé"
        )
    
    if not os.path.exists(db_post.get("file_path")):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    return FileResponse(
        path=db_post.get("file_path"),
        filename=db_post.get("file_name"),
        media_type=db_post.get("mime_type")
    )

# ==================== LIKES ====================

@router.post("/posts/{post_id}/like", response_model=LikeResponse, status_code=status.HTTP_201_CREATED)
def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PostService = Depends(get_post_service)
):
    """Liker un post"""
    # Vérifier que le post existe
    db_post = service.get_post(post_id=post_id, current_user_id=current_user.id)
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post non trouvé"
        )
    
    # Créer le like
    try:
        like = service.create_like(post_id=post_id, user_id=current_user.id)
        return like
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.delete("/posts/{post_id}/like", status_code=status.HTTP_204_NO_CONTENT)
def unlike_post(
    post_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PostService = Depends(get_post_service)
):
    """Retirer son like d'un post"""
    success = service.delete_like(post_id=post_id, user_id=current_user.id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Like non trouvé"
        )


@router.get("/posts/{post_id}/likes/count")
def get_likes_count(
    post_id: int,
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service)
):
    """Obtenir le nombre de likes d'un post"""
    count = service.get_likes_count(post_id=post_id)
    return {"post_id": post_id, "likes_count": count}

# ==================== COMMENTS ====================

@router.post("/posts/{post_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
def create_comment(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PostService = Depends(get_post_service)
):
    """Créer un commentaire sur un post"""
    # Vérifier que le post existe
    db_post = service.get_post(post_id=post_id)
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post non trouvé"
        )
    
    db_comment = service.create_comment(
        post_id=post_id,
        user_id=current_user.id,
        content=comment.content
    )
    
    return db_comment


@router.get("/posts/{post_id}/comments", response_model=CommentListResponse)
def get_comments(
    post_id: int,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db),
    service: PostService = Depends(get_post_service)
):
    """Obtenir les commentaires d'un post"""
    comments, total = service.get_comments(
        post_id=post_id,
        skip=skip,
        limit=limit
    )
    
    return CommentListResponse(total=total, comments=comments)


@router.put("/comments/{comment_id}", response_model=CommentResponse)
def update_comment(
    comment_id: int,
    comment_update: CommentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PostService = Depends(get_post_service)
):
    """Modifier un commentaire"""
    db_comment = service.get_comment(comment_id=comment_id)
    
    if db_comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    if db_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de modifier ce commentaire"
        )
    
    db_comment = service.update_comment(
        comment_id=comment_id,
        content=comment_update.content
    )
    
    return db_comment


@router.delete("/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_comment(
    comment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    service: PostService = Depends(get_post_service)
):
    """Supprimer un commentaire"""
    db_comment = service.get_comment(comment_id=comment_id)
    
    if db_comment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Commentaire non trouvé"
        )
    
    if db_comment.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer ce commentaire"
        )
    
    service.delete_comment(comment_id=comment_id)