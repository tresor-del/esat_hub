import re
import uuid
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.db.schemas.user import User, UserStatus
from app.db.schemas.email_verification import EmailVerificationToken
from app.models.user import  UserInDatabase
from app.core.config import settings
from app.db.security import hash_password, verify_password


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
        user.status = UserStatus.ACTIVE
        self._db.delete(record)
        self._db.commit()
        self._db.refresh(user)
        
    def check_duplicated_email(self, user_email: str) -> bool:
        user = self._db.query(User).filter(User.email == user_email).first()
        
        if not user:
            return False
        
        if not user.status == UserStatus.ACTIVE:
            self._db.delete(user)
            self._db.commit()
            return False 
            
        return True

    
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
    
    def get_admin(self)-> User | None:
        return self._db.query(User).filter(User.username == settings.SUPER_ADMIN_USERNAME).first()
    
    def update_user(self, user_id: uuid.UUID, user_update) -> User | None:
        user = self.get_user(user_id)
        if not user:
            return None

        update_data = user_update.model_dump(exclude_unset=True)

        if "new_password" in update_data:
            new_password = update_data.get("new_password")
            old_password = update_data.get("old_password")

            if not old_password:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="L'ancien mot de passe est obligatoire."
                )
            
            if not verify_password(old_password, user.hashed_password):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Mot de passe incorrect"
                )   
            
            user.hashed_password = hash_password(new_password)

            update_data.pop("old_password", None)
            update_data.pop("new_password", None)

        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        
        self._db.commit()
        self._db.refresh(user)
        return user
    
    def delete_user(self, user_id: uuid.UUID) -> None:
        user = self.get_user(user_id)
        if user:
            self._db.delete(user)
            self._db.commit()
    
    def get_all_users(self) -> list[User]:
        """Récupère tous les utilisateurs"""
        return self._db.query(User).filter(User.status == UserStatus.ACTIVE).all()
    
    def get_users_by_room_id(self, room_id: uuid.UUID) -> list[User]:
        """Récupère tous les utilisateurs d'une salle spécifique"""
        return self._db.query(User).filter(User.user_room_id == room_id).all()
    
    def get_user_by_rfid_uid(self, uid: str) -> list[User]:
        """Récupère tous les utilisateurs d'une salle spécifique"""
        return self._db.query(User).filter(User.rfid_uid == uid).first()
    