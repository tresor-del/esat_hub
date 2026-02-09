from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import os
from pathlib import Path

from app.dependencies import get_db, get_current_user
from app.schemas.post import PostResponse, PostUpdate, PostListResponse, PostType
from app.crud import post as crud
from app.utils.files import save_upload_file
from app.models.user import User

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
    current_user: User = Depends(get_current_user)  # Utilisateur connecté
):
    """
    Créer un nouveau poste avec une photo ou un document.
    Nécessite une authentification.
    
    - **title**: Titre du poste (obligatoire)
    - **description**: Description du poste (optionnel)
    - **post_type**: Type de poste ("photo" ou "document")
    - **file**: Fichier à uploader
    """
    try:
        # Sauvegarder le fichier
        file_path, original_filename = save_upload_file(
            file, 
            post_type.value,
            ALLOWED_DOCUMENT_EXTENSIONS,
            ALLOWED_PHOTO_EXTENSIONS, 
            UPLOAD_DIR
        )
        
        # Créer le poste dans la base de données avec l'ID de l'utilisateur
        db_post = crud.create_post(
            db=db,
            title=title,
            description=description,
            post_type=post_type.value,
            file_path=file_path,
            file_name=original_filename,
            mime_type=file.content_type,
            user_id=current_user.id  # Ajout de l'utilisateur
        )
        
        return db_post
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du poste: {str(e)}"
        )


@router.get("/posts/", response_model=PostListResponse)
def read_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    post_type: Optional[PostType] = None,
    my_posts: bool = Query(False, description="Afficher uniquement mes posts"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer la liste des postes avec pagination.
    Nécessite une authentification.
    
    - **skip**: Nombre de postes à ignorer (pour la pagination)
    - **limit**: Nombre maximum de postes à retourner
    - **post_type**: Filtrer par type de poste (optionnel)
    - **my_posts**: Si true, ne retourner que les posts de l'utilisateur connecté
    """
    user_id = current_user.id if my_posts else None
    
    posts, total = crud.get_posts(
        db,
        skip=skip,
        limit=limit,
        post_type=post_type.value if post_type else None,
        user_id=user_id
    )
    
    return PostListResponse(total=total, posts=posts)


@router.get("/posts/search/", response_model=PostListResponse)
def search_posts(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    my_posts: bool = Query(False, description="Rechercher uniquement dans mes posts"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Rechercher des postes par titre ou description.
    Nécessite une authentification.
    
    - **q**: Terme de recherche
    - **skip**: Nombre de postes à ignorer (pour la pagination)
    - **limit**: Nombre maximum de postes à retourner
    - **my_posts**: Si true, rechercher uniquement dans les posts de l'utilisateur
    """
    user_id = current_user.id if my_posts else None
    
    posts, total = crud.search_posts(
        db, 
        query=q, 
        skip=skip, 
        limit=limit,
        user_id=user_id
    )
    
    return PostListResponse(total=total, posts=posts)


@router.get("/posts/{post_id}", response_model=PostResponse)
def read_post(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Récupérer un poste spécifique par ID.
    Nécessite une authentification.
    
    - **post_id**: ID du poste
    """
    db_post = crud.get_post(db, post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
        )
    
    return db_post


@router.put("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_update: PostUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Mettre à jour un poste existant.
    L'utilisateur ne peut modifier que ses propres posts.
    
    - **post_id**: ID du poste à mettre à jour
    - **post_update**: Données à mettre à jour
    """
    # Vérifier que le post existe et appartient à l'utilisateur
    db_post = crud.get_post(db, post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
        )
    
    if db_post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de modifier ce poste"
        )
    
    db_post = crud.update_post(db, post_id=post_id, post_update=post_update)
    
    return db_post


@router.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Supprimer un poste.
    L'utilisateur ne peut supprimer que ses propres posts.
    
    - **post_id**: ID du poste à supprimer
    """
    # Récupérer le poste pour vérifier la propriété et supprimer le fichier
    db_post = crud.get_post(db, post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
        )
    
    if db_post.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vous n'avez pas la permission de supprimer ce poste"
        )
    
    # Supprimer le fichier du système de fichiers
    try:
        if os.path.exists(db_post.file_path):
            os.remove(db_post.file_path)
    except Exception as e:
        print(f"Erreur lors de la suppression du fichier: {e}")
    
    # Supprimer de la base de données
    success = crud.delete_post(db, post_id=post_id)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
        )
    
    return None


@router.get("/posts/{post_id}/file")
def download_file(
    post_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Télécharger le fichier associé à un poste.
    Nécessite une authentification.
    
    - **post_id**: ID du poste
    """
    db_post = crud.get_post(db, post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
        )
    
    if not os.path.exists(db_post.file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fichier non trouvé"
        )
    
    return FileResponse(
        path=db_post.file_path,
        filename=db_post.file_name,
        media_type=db_post.mime_type
    )