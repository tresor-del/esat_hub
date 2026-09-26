from sqlalchemy import select
from sqlalchemy.orm import Session
from typing import Type, TypeVar, List

ModelType = TypeVar("ModelType")

def paginate_query(
        db: Session,
        statement,
        page: int = 1,
        page_size: int = 20
) -> List[ModelType]:
    
    skip = (page - 1) * page

    paginated_stmt = statement.offset(skip).limit(page_size)

    result = db.execute(paginated_stmt)
    return result.scalars().all()