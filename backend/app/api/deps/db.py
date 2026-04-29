from app.db.database import SessionLocal

def get_db():
    """
    Dépendence pour injecter la base de donnée dans les routes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()