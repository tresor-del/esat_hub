import datetime
import secrets
import uuid

from sqlalchemy.orm import Session
from app.db.schemas.user import User
from app.db.schemas.email_verification import EmailVerificationToken

class EmailService:
    def __init__(self, db: Session):
        # On injecte la session DB pour qu'elle soit dispo partout dans la classe
        self._db = db

    def send_verification_email(self, email: str, token: str):
        # On passe les données en paramètres de la méthode
        verification_link = f"http://localhost:3000/confirm-email?token={token}"
        print(f"[EMAIL] To: {email} | Link: {verification_link}")
        
    def check_verification_token(self, token: str) -> EmailVerificationToken | None:
        # self._db est maintenant bien défini via le __init__
        record = self._db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token == token
        ).first()
        return record 
    
    def validate_user(self, record: EmailVerificationToken) -> User | None:
        user = self._db.query(User).filter(User.id == record.user_id).first()
        if user:
            return user
        return None

    def create_verification_email(self, user_id: uuid.UUID) -> str:

        token = secrets.token_urlsafe(32)
        
        verification = EmailVerificationToken(
            user_id=user_id,
            token=token,
            expires_at=datetime.datetime.now(datetime.UTC) + datetime.timedelta(hours=24),
        )
        
        self._db.add(verification)
        self._db.commit()
        
        return verification.token