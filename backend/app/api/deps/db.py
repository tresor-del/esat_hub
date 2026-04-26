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