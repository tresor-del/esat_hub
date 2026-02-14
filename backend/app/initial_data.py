import logging

from sqlalchemy.orm import Session

from app.db.database import Base, engine


logger = logging.getLogger(__name__)

def init_db() -> None:
    # les tables seront crées par elembic
    with Session(engine) as session:
        pass
        
def main() -> None:
    logger.info("Creating initial data")
    init_db()
    logger.info("Initial data created")

if __name__ == "__main__":
    main()
    