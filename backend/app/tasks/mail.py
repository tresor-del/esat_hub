from uuid import UUID

from app.db.database import SessionLocal
from app.services.auth.email import EmailService
from app.db.schemas.user import User
from app.models.user import UserInDatabase

def send_verification_task(user: UserInDatabase, token: str):
    with SessionLocal() as db: 
        service = EmailService(db)
        service.send_verification_email(user, token)

def resend_verification_task(email):
    with SessionLocal() as db: 
        service = EmailService(db)
        service.resend_verification_email(email)
