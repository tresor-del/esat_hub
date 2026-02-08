from fastapi import APIRouter, File, UploadFile, Form, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional, List
import shutil
import os
from pathlib import Path
import uuid

from app.dependencies import get_db
from app.schemas.post import PostResponse, PostUpdate, PostListResponse, PostType
from app.crud import post as crud

app = APIRouter(tags=["posts"])


# Créer le dossier uploads s'il n'existe pas
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Extensions de fichiers autorisées
ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".xlsx", ".xls", ".ppt", ".pptx"}


def save_upload_file(upload_file: UploadFile, post_type: str) -> tuple[str, str]:
    """Sauvegarder le fichier uploadé et retourner le chemin et le nom"""
    # Vérifier l'extension
    file_ext = Path(upload_file.filename).suffix.lower()
    
    if post_type == "photo" and file_ext not in ALLOWED_PHOTO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension non autorisée pour une photo. Extensions autorisées: {ALLOWED_PHOTO_EXTENSIONS}"
        )
    
    if post_type == "document" and file_ext not in ALLOWED_DOCUMENT_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Extension non autorisée pour un document. Extensions autorisées: {ALLOWED_DOCUMENT_EXTENSIONS}"
        )
    
    # Générer un nom de fichier unique
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / post_type / unique_filename
    
    # Créer le sous-dossier si nécessaire
    file_path.parent.mkdir(exist_ok=True)
    
    # Sauvegarder le fichier
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return str(file_path), upload_file.filename

@app.post("/posts/", response_model=PostResponse, status_code=status.HTTP_201_CREATED)
async def create_post(
    title: str = Form(...),
    description: Optional[str] = Form(None),
    post_type: PostType = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Créer un nouveau poste avec une photo ou un document.
    
    - **title**: Titre du poste (obligatoire)
    - **description**: Description du poste (optionnel)
    - **post_type**: Type de poste ("photo" ou "document")
    - **file**: Fichier à uploader
    """
    try:
        # Sauvegarder le fichier
        file_path, original_filename = save_upload_file(file, post_type.value)
        
        # Créer le poste dans la base de données
        db_post = crud.create_post(
            db=db,
            title=title,
            description=description,
            post_type=post_type.value,
            file_path=file_path,
            file_name=original_filename,
            mime_type=file.content_type
        )
        
        return db_post
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erreur lors de la création du poste: {str(e)}"
        )

@app.get("/posts/", response_model=PostListResponse)
def read_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    post_type: Optional[PostType] = None,
    db: Session = Depends(get_db)
):
    """
    Récupérer la liste des postes avec pagination.
    
    - **skip**: Nombre de postes à ignorer (pour la pagination)
    - **limit**: Nombre maximum de postes à retourner
    - **post_type**: Filtrer par type de poste (optionnel)
    """
    posts, total = crud.get_posts(
        db,
        skip=skip,
        limit=limit,
        post_type=post_type.value if post_type else None
    )
    
    return PostListResponse(total=total, posts=posts)

@app.get("/posts/search/", response_model=PostListResponse)
def search_posts(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """
    Rechercher des postes par titre ou description.
    
    - **q**: Terme de recherche
    - **skip**: Nombre de postes à ignorer (pour la pagination)
    - **limit**: Nombre maximum de postes à retourner
    """
    posts, total = crud.search_posts(db, query=q, skip=skip, limit=limit)
    
    return PostListResponse(total=total, posts=posts)

@app.get("/posts/{post_id}", response_model=PostResponse)
def read_post(post_id: int, db: Session = Depends(get_db)):
    """
    Récupérer un poste spécifique par ID.
    
    - **post_id**: ID du poste
    """
    db_post = crud.get_post(db, post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
        )
    
    return db_post

@app.put("/posts/{post_id}", response_model=PostResponse)
def update_post(
    post_id: int,
    post_update: PostUpdate,
    db: Session = Depends(get_db)
):
    """
    Mettre à jour un poste existant.
    
    - **post_id**: ID du poste à mettre à jour
    - **post_update**: Données à mettre à jour
    """
    db_post = crud.update_post(db, post_id=post_id, post_update=post_update)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
        )
    
    return db_post

@app.delete("/posts/{post_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_post(post_id: int, db: Session = Depends(get_db)):
    """
    Supprimer un poste.
    
    - **post_id**: ID du poste à supprimer
    """
    # Récupérer le poste pour supprimer le fichier
    db_post = crud.get_post(db, post_id=post_id)
    
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Poste non trouvé"
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

@app.get("/posts/{post_id}/file")
def download_file(post_id: int, db: Session = Depends(get_db)):
    """
    Télécharger le fichier associé à un poste.
    
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