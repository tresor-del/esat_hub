from fastapi import Depends
from sqlalchemy.orm import Session

from app.services.users import AuthService
from app.services.email import EmailService
from app.services.posts import PostService
from app.services.files import FileService
from app.services.comment import CommentService
from app.services.notification import NotificationService
from app.services.room import RoomService
from app.services.admin.manager import AdminService
from app.api.deps.db import get_db


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

async def get_admin_service(db: Session = Depends(get_db)):
    """
    Dependency to get the admin service.
    Provides admin-specific functionality.
    """
    return AdminService(db)