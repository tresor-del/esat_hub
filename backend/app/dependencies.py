from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session

from typing import Annotated

from app.db.database import SessionLocal
from app.db.security import oauth2_scheme
from app.core.config import settings
from app.db.schemas.user import User
from app.models.token import TokenData
from app.services.users import AuthService
from app.services.email import EmailService
from app.services.posts import PostService
from app.services.files import FileService
from app.services.comment import CommentService
from app.services.notification import NotificationService
from app.services.room import RoomService

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




def get_auth_service(session = Depends(get_db)) -> AuthService:
    return AuthService(session)

def get_email_service(session = Depends(get_db)) -> EmailService:
    return EmailService(session)

def get_post_service(session = Depends(get_db)) -> PostService:
    return PostService(session)

def get_file_service() -> FileService:
    return FileService()

def get_comment_service(session = Depends(get_db)):
    return CommentService(session)

def get_notification_service(session = Depends(get_db)):
    return NotificationService(session)

def get_room_service(session = Depends(get_db)):
    return RoomService(session)


async def get_current_admin(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to verify the current user is an admin.
    Used for admin-only routes.
    """
    from app.db.schemas.user import UserRole
    
    # Check if user is admin
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user


async def get_admin_service(db: Session = Depends(get_db)):
    """
    Dependency to get the admin service.
    Provides admin-specific functionality.
    """
    from app.services.admin import AdminService
    return AdminService(db)