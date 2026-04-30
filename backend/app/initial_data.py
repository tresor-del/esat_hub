import logging

from sqlalchemy.orm import Session

from app.db.database import engine
from app.db.schemas.user import User
from app.services.auth.users import AuthService
from app.db.database import SessionLocal
from app.models.user import UserInDatabase
from app.db.security import hash_password
from app.db.schemas.room import Room, RoomNames
from app.core.config import settings


logger = logging.getLogger(__name__)

def init_rooms(session: Session) -> None:
    """Crée les salles de classe si elles n'existent pas"""
    for room_enum in RoomNames:
        room_exists = session.query(Room).filter(Room.name == room_enum).first()
        if not room_exists:
            logger.info(f"Création de la salle : {room_enum.value}")
            new_room = Room(name=room_enum)
            session.add(new_room)
    session.commit()

def create_super_admin(session: Session) -> None:
    auth_service = AuthService(session)
    super_admin_user = session.query(User).filter(User.username == settings.SUPER_ADMIN_USERNAME).first()

    if not super_admin_user:
        admin_password = hash_password(settings.SUPER_ADMIN_PASSWORD)
        super_admin_data = UserInDatabase(
            first_name=settings.SUPER_ADMIN_FIRST_NAME,
            last_name=settings.SUPER_ADMIN_LAST_NAME,
            username=settings.SUPER_ADMIN_USERNAME,
            profil_name=settings.SUPER_ADMIN_PROFIL_NAME,
            email=settings.SUPER_ADMIN_EMAIL,
            phone_number=settings.SUPER_ADMIN_PHONE_NUMBER,
            birthday=settings.SUPER_ADMIN_BIRTHDAY,
            card_number=settings.SUPER_ADMIN_CARD_NUMBER,
            school_name=settings.SUPER_ADMIN_SCHOOL_NAME,
            domain=settings.SUPER_ADMIN_DOMAIN,
            level=settings.SUPER_ADMIN_LEVEL,
            year=settings.SUPER_ADMIN_YEAR,
            role=settings.SUPER_ADMIN_ROLE,
            hashed_password=admin_password,
            status=settings.SUPER_ADMIN_STATUS
        )
        auth_service.create_user(user_data=super_admin_data)
            

def init_db() -> None:
    # les tables seront crées par alembic
    session = SessionLocal()
    try:

        # creation des salles de classe
        init_rooms(session)
        
        # creation du super_admin
        create_super_admin(session)
        
        session.commit()

    finally:
        session.close()

        
def main() -> None:
    logger.info("Creating initial data")
    init_db()
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
    