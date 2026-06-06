from contextlib import contextmanager

from app.db.database import SessionLocal 


@contextmanager
def get_tasks_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()