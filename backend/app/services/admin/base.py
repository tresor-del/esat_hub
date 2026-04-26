from sqlalchemy.orm import Session

class BaseAdminService:

    def __init__(self, db: Session):
        self._db = db
