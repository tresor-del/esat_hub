import os
import uuid
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from fastapi.responses import FileResponse

from app.db.schemas.user import User

from sqlalchemy.orm import Session

from app.dependencies import get_current_user, get_db
from app.core.config import settings
from app.dependencies import get_auth_service


os.makedirs(settings.AVATAR_DIR, exist_ok=True)

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{user_id}")
def get_user_profil(
    user_id: uuid.UUID,  
     db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    user_service = Depends(get_auth_service)
):
    
    user = user_service.get_user(user_id)

    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

