from datetime import datetime, timedelta
import secrets
import uuid
from sqlalchemy.orm import Session

from app.db.security import hash_password
from app.models.user import User
from app.models.email_verification import EmailVerificationToken


def create_user(*, db: Session, username: str, password: str, is_verified: bool):
    user = User(
        email=username,
        hashed_password=hash_password(password),
        is_verified=is_verified,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def create_verification_email(*, db: Session, user_id: uuid):

    token = secrets.token_urlsafe(32)
    
    verification = EmailVerificationToken(
        user_id=user_id,
        token=token,
        expires_at=datetime.utcnow() + timedelta(hours=24),
    )
    
    db.add(verification)
    db.commit()
    
    return verification.token