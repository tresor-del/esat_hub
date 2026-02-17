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
        
    def check_user_email_verification_token(self, token: str) -> bool:
        # self._db est maintenant bien défini via le __init__
        record = self._db.query(EmailVerificationToken).filter(
            EmailVerificationToken.token == token
        ).first()
        return record # Plus pythonique que "True if record else False"
