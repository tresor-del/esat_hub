from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from typing import Annotated

from app.db.database import SessionLocal
from app.db.security import oauth2_scheme
from app.core.config import settings
from app.models.user import User
from app.schemas.token import TokenData
from app.enums.role_enum import RoleEnum

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)], db: Session = Depends(get_db)):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
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

def requires_roles(*role: RoleEnum):
    def checker(user: User = Depends(get_current_user)):
        user_role = {role.name for role in user.role}
        
        if not user_role.intersection(role):
            raise HTTPException(
                status_code=403,
                detail="Permission denied"
            )
        return user
    return checker