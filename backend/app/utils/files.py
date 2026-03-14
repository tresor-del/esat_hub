from pathlib import Path
import shutil
import uuid
from fastapi import HTTPException, UploadFile, status


def save_upload_file(
    upload_file: UploadFile, 
    post_type: str,
    ALLOWED_DOCUMENT_EXTENSIONS: dict,
    ALLOWED_PHOTO_EXTENSIONS: dict,
    UPLOAD_DIR: str
) -> tuple[str, str]:
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
    file_path = Path(UPLOAD_DIR) / post_type / unique_filename
    
    # Créer le sous-dossier si nécessaire
    file_path.parent.mkdir(exist_ok=True)
    
    # Sauvegarder le fichier
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(upload_file.file, buffer)
    
    return str(file_path), upload_file.filename