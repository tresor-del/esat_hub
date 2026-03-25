import re
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.schemas.user import User
from app.db.schemas.email_verification import EmailVerificationToken
from app.models.user import  UserInDatabase


class AuthService:
    
    def __init__(self, session: Session):
        self._db = session
        

    def get_username(self, profil_name: str, school_name: str) -> str|None:
        validated_profil_name = profil_name.strip().lower()
        if re.match("^[a-z0-9_]+$", validated_profil_name):
            validated_school_name = school_name.strip().lower()
            username = f"{validated_profil_name}@{validated_school_name}"
            return username
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Le nom de profil n'est pas valide"
        )

    def confirm_user(self, user: User, record: EmailVerificationToken):
        user.is_verified = True
        self._db.delete(record)
        self._db.commit()
        self._db.refresh(user)
        
    def check_duplicated_email(self, user_email: str) -> bool:
        result = self._db.query(User).filter(User.email == user_email).first()
        return True if result else False
    
    def check_duplicated_profil_name(self, profil_name: str) -> bool:
        result = self._db.query(User).filter(User.profil_name == profil_name).first()
        return True if result else False
        
    def create_user(self, user_data: UserInDatabase) -> User:
        validated_data = user_data.model_dump()
        user = User(**validated_data)

        self._db.add(user)
        self._db.commit()
        self._db.refresh(user)
        return user

    def get_user(self, user_id: uuid.UUID) -> User | None:
        return self._db.query(User).filter(User.id == user_id).first()
    
    def delete_user(self, user_id: uuid.UUID) -> None:
        user = self.get_user(user_id)
        if user:
            self._db.delete(user)
            self._db.commit()
    
    