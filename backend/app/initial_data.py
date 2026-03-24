import logging

from sqlalchemy.orm import Session

from app.db.database import engine
from app.db.schemas.user import User
from app.services.users import AuthService
from app.db.database import SessionLocal
from app.models.user import UserInDatabase
from app.db.security import hash_password


logger = logging.getLogger(__name__)

def init_db() -> None:
    # les tables seront crées par alembic
    session = SessionLocal()
    try:
        auth_service = AuthService(session)

        # creation du super_admin
        super_admin_user = session.query(User).filter(User.username == "admin@admin_school").first()

        if not super_admin_user:
            admin_password = hash_password("admin_s")
            super_admin_data = UserInDatabase(
                first_name="Admin",
                last_name="Super",
                username="admin@admin_school",
                profil_name="admin",
                email="admin@gmail.com",
                school_name="ESAT_TOGO",
                domain="INFORMATIQUE",
                level="PREPA",
                hashed_password=admin_password,
                is_verified=True
            )
            auth_service.create_user(user_data=super_admin_data)
            
    finally:
        session.close()

        
def main() -> None:
    logger.info("Creating initial data")
    init_db()
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
    