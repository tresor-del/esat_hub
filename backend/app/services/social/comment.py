import uuid
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.models.comment import CommentCreate, CommentListResponse, CommentResponse
from app.db.schemas.comments import Comment


class CommentService:

    def __init__(self, db: Session):
        self._db = db

    def get_comment_in_db(self, comment_id: uuid.UUID)-> Comment:
        comment = self._db.query(Comment).filter(Comment.id == comment_id).first()
        return comment

    def get_comment(self, comment_id: uuid.UUID) -> CommentResponse:
        comment = self.get_comment_in_db(comment_id)
        return CommentResponse.model_validate(comment)
    
    def create_comment(self, data: CommentCreate) -> CommentResponse:
        validate_data = data.model_dump()
        data_in_db = Comment(**validate_data)
        self._db.add(data_in_db)
        self._db.commit()
        self._db.refresh(data_in_db)
        return CommentResponse.model_validate(data_in_db)
    
    def update_comment(self,comment_id: uuid.UUID, new_content: str) -> CommentResponse:
        comment = self.get_comment_in_db(comment_id=comment_id)
        comment.content = new_content
        self._db.commit()
        self._db.refresh(comment)
        return CommentResponse.model_validate(comment)
    
    def delete_comment(self, comment_id: uuid.UUID) -> bool:
        comment = self.get_comment_in_db(comment_id=comment_id)
        self._db.delete(comment)
        self._db.commit()
        return True
    
    def get_comments(self, post_id: int) -> CommentListResponse:
        statement = select(Comment).where(Comment.post_id == post_id)
        comments = self._db.execute(statement).scalars().all()
        total = len(comments)
        return CommentListResponse(total=total, comments=comments)


