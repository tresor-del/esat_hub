import logging

from sqlalchemy.orm import Session

from app.db.database import Base, engine
from app.db.schemas.user import User
from app.services.auth_service import AuthService



logger = logging.getLogger(__name__)

def init_db() -> None:
    # les tables seront crées par elembic
    with Session(engine) as session:

        auth_service = AuthService(session)

        auth_service.create_user(
            username="tresor@esathub.com",
            password="tresor",
            is_verified=true
        )

        
def main() -> None:
    logger.info("Creating initial data")
    init_db()
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
    