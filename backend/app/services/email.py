import datetime
import secrets
import uuid
import smtplib
from email.message import EmailMessage

from sqlalchemy.orm import Session
from app.db.schemas.user import User
from app.db.schemas.email_verification import EmailVerificationToken
from app.core.config import settings
from app.models.user import UserInDatabase

class EmailService:
    def __init__(self, db: Session):
        self._db = db

    def send_verification_email(self, user: UserInDatabase, token: str):
        verification_link = f"{settings.FRONTEND_HOST}/confirm-email?token={token}"
        
        # 1. Création du message
        msg = EmailMessage()
        msg["Subject"] = "Confirmez votre inscription - Mon École"
        msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.EMAILS_FROM_EMAIL}>"
        msg["To"] = user.email
        
        # Contenu HTML 
        msg.set_content(f"Cliquez ici pour confirmer votre email : {verification_link}") # Fallback texte
        msg.add_alternative(f"""\
        <html>
          <body>
            <h2>Bienvenue sur Esat-Hub!</h2>
            <h4>Voici vos identifiants:</h4>
            <ul>
                <li>Username: {user.username}</li>
            </ul>
            <p>Veuillez cliquer sur le bouton ci-dessous pour valider votre compte :</p>
            <a href="{verification_link}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Confirmer mon compte</a>
            <p>Ce lien expirera dans 15min.</p>
          </body>
        </html>
        """, subtype='html')

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