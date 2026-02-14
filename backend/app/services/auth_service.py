from datetime import datetime, timedelta
import secrets
import uuid
from sqlalchemy.orm import Session

from app.db.schemas.user import User
from app.db.security import hash_password
from app.db.schemas.email_verification import EmailVerificationToken


class AuthService:
    
    def __init__(self, session: Session):
        self._db = session
        
    def check_user_email_verification_token(self, record: EmailVerificationToken) -> bool:
        user = self._db.query(User).filter(User.id == record.user_id).first()
        return True if user else False
    
    def check_verification_token(self, token: str) -> bool:
        record = self._db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token == token
        ).first()
        return True if record else False

    def confirm_user(self, user: User, record: EmailVerificationToken):
        user.is_verified = True
        self._db.delete(record)
        self._db.commit()
        self._db.refresh(user)
        
    def check_duplicated_email(self, user_email: str) -> bool:
        result = self._db.query(User).filter(User.email == user_email).first()
        return True if result else False
        
    def create_user(self, username: str, password: str, is_verified: bool) -> User:
        user = User(
            email=username,
            hashed_password=hash_password(password),
            is_verified=is_verified,
        )
        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user
    
    def create_verification_email(self, db: Session, user_id: uuid.UUID) -> str:

        token = secrets.token_urlsafe(32)
        
        verification = EmailVerificationToken(
            user_id=user_id,
            token=token,
            expires_at=datetime.utcnow() + timedelta(hours=24),
        )
        
        self._db.add(verification)
        self._db.commit()
        
        return verification.token
    
    