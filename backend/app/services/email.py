import datetime
import secrets
import uuid
import smtplib
from email.message import EmailMessage

from fastapi import BackgroundTasks
from sqlalchemy.orm import Session
from app.db.schemas.user import User
from app.db.schemas.email_verification import EmailVerificationToken
from app.core.config import settings
from app.models.user import UserInDatabase
from app.core.templates import email_templates

template = email_templates.get_template("verification.html")


class EmailService:
    def __init__(self, db: Session):
        self._db = db

    def send_verification_email(self, user: UserInDatabase, token: str):
        verification_link = f"{settings.FRONTEND_HOST}/confirm-email?token={token}"
        html_content = template.render(
            username=user.username,
            verification_link=verification_link,
            app_name=settings.APP_NAME
        )

        # 1. Création du message
        msg = EmailMessage()
        msg["Subject"] = f"Confirmez votre inscription - {settings.APP_NAME}"
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = user.email
        
        # Contenu HTML 
        msg.set_content(f"Cliquez ici pour confirmer votre email : {verification_link}") 
        msg.add_alternative(html_content, subtype='html')

        # 2. Envoi via SMTP
        try:
            with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
                server.starttls()  # Sécurisation de la connexion
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
                server.send_message(msg)
            print(f"[SUCCESS] Email envoyé à {user.email}")
        except Exception as e:
            print(f"[ERROR] Impossible d'envoyer l'email : {e}")

        print(f"[EMAIL] To: {user.email} | Link: {verification_link}")
        
    def check_verification_token(self, token: str) -> EmailVerificationToken | None:
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
    
    def resend_verification_email(self, email: str, bg_tasks: BackgroundTasks):

        user = self._db.query(User).filter(User.email == email).first()

        if not user or user.is_verified:
            return 
        
        self._db.query(EmailVerificationToken).filter(EmailVerificationToken.user_id == user.id).delete()

        new_token = self.create_verification_email(user.id)

        bg_tasks.add_task(self.send_verification_email, email, new_token)