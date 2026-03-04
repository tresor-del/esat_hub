import logging

from sqlalchemy.orm import Session

from app.db.database import engine
from app.db.schemas.user import User
from app.services.auth_service import AuthService
from app.db.database import SessionLocal



logger = logging.getLogger(__name__)

def init_db() -> None:
    # les tables seront crées par alembic
    session = SessionLocal()
    try:
        auth_service = AuthService(session)

        # creation du super_admin
        super_admin_user = session.query(User).filter(User.email == "tresor@esathub.com").first()

        if not super_admin_user:
            auth_service.create_user(
                username="tresor@esathub.com",
                password="tresor",
                is_verified=True
            )
            
    finally:
        session.close()

        
def main() -> None:
    logger.info("Creating initial data")
    init_db()
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
    