from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.dependencies import get_current_user, get_db
from app.engine.search_engine import SearchEngine
from app.db.schemas.user import User


router = APIRouter(prefix="/search", tags=["search"])

@router.get("/general")
def general_search(
    q: str,
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db), 
    skip: int = 0, 
    limit: int = 10
):

    search_engine = SearchEngine(db, current_user)
    return search_engine.general_search(q, skip, limit)

