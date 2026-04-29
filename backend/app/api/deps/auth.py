from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from typing import Annotated

from app.db.security import oauth2_scheme
from app.core.config import settings
from app.db.schemas.user import User
from app.models.token import TokenData
from app.api.deps.db import get_db


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):
    """
    Dépendence pour sécuriser l'accès aux routes contre les utilisateurs non connecté.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Vérifier si le token de l'utilisateur est valide.
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=settings.ALGORITHM)
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id)
        
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if not user:
        raise credentials_exception
    return user

async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
) -> User:
    """
    Dépendence pour vérifier que l'utilisateur connecté est un admin.
    Utilisé uniquement pour les routes admins.
    """
    from app.db.schemas.user import UserRole
    
    # Vérifier si l'utilisateur est admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

