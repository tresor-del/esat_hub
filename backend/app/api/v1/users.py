import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse
from PIL import Image
import io

from app.db.schemas.user import User

from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.core.config import settings


os.makedirs(settings.AVATAR_DIR, exist_ok=True)

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}")
def get_user_profil(
    user_id: uuid.UUID,  
     db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    
    user = db.query(User).filter(User.id == user_id).first()

    return user

@router.post("/me/avatar")
async def upload_avatar(
    avatar: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):


    # Vérifier le type

    if avatar.content_type not in settings.ALLOWED_TYPES:
        raise HTTPException(400, "Type de fichier non autorisé")
    
    # Lire le contenu
    content = await avatar.read()
    
    # Vérifier la taille
    if len(content) > settings.MAX_SIZE:
        raise HTTPException(400, "Fichier trop volumineux (max 2MB)")
    
    # Redimensionner avec Pillow
    image = Image.open(io.BytesIO(content))
    image = image.convert("RGB")
    image.thumbnail((200, 200))  # max 200x200 en gardant le ratio
    
    # Supprimer l'ancien avatar si existe
    if current_user.avatar_path and os.path.exists(current_user.avatar_path):
        os.remove(current_user.avatar_path)
    
    # Sauvegarder avec un nom unique
    filename = f"{uuid.uuid4()}.jpg"
    filepath = os.path.join(settings.AVATAR_DIR, filename)
    image.save(filepath, "JPEG", quality=85)
    
    # Mettre à jour en base
    current_user.avatar_path = filepath
    db.commit()
    
    return {"message": "Avatar mis à jour", "avatar_path": filepath}

@router.get("/{user_id}/avatar")
async def get_avatar(user_id: uuid.UUID, db: Session = Depends(get_db)):
    
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user or not user.avatar_path or not os.path.exists(user.avatar_path):
        # Retourner un avatar par défaut
        return FileResponse("static/default_avatar.png")
    
    return FileResponse(user.avatar_path)