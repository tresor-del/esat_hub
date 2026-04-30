from fastapi import Depends
from sqlalchemy.orm import Session

from app.services.auth.users import AuthService
from app.services.auth.email import EmailService
from app.services.social.posts import PostService
from app.services.common.files import FileService
from app.services.social.comment import CommentService
from app.services.interactions.notification import NotificationService
from app.services.social.room import RoomService
from app.services.admin.manager import AdminService
from app.api.deps.db import get_db

"""
Fichier de dépendence pour les services de l'application
"""

def get_auth_service(session = Depends(get_db)) -> AuthService:
    """
    Retourne le service d'authentification et de gestion des users
    """
    return AuthService(session)

def get_email_service(session = Depends(get_db)) -> EmailService:
    """
    Retourne le service d'envoie de mail.
    """
    return EmailService(session)

def get_post_service(session = Depends(get_db)) -> PostService:
    """
    Retourne le service de gestion des posts.
    """
    return PostService(session)

def get_file_service() -> FileService:
    """
    Retourne le service de gestion des fichiers.
    """
    return FileService()

def get_comment_service(session = Depends(get_db)) -> CommentService:
    """
    Retourne le service de gestion des commentaires
    """
    return CommentService(session)

def get_notification_service(session = Depends(get_db)) -> NotificationService:
    """
    Retourne le service de gestion des commentaires
    """
    return NotificationService(session)

def get_room_service(session = Depends(get_db)) -> RoomService:
    """
    Retourne le service de gestion des salles de classe
    """
    return RoomService(session)

async def get_admin_service(db: Session = Depends(get_db)) -> AdminService:
    """
    Retourne le service d'administration de l'application
    """
    return AdminService(db)