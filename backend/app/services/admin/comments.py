from typing import Optional
from uuid import UUID

from app.db.schemas.comments import Comment
from app.services.admin.base import BaseAdminService
from app.models.comment import CommentListResponse, CommentResponse, CommentStatsResponse


class AdminCommentsService(BaseAdminService):
    
    def get_all_comments(
        self,
        skip: int = 0,
        limit: int = 100,
        post_id: Optional[UUID] = None
    ) -> CommentListResponse:
        """
        Retourne tous les commentaires avec des filtres optionnels.
        """
        query = self._db.query(Comment)

        if post_id:
            query = query.filter(Comment.post_id == post_id)

        total = query.count()
        comments = query.order_by(Comment.created_at.desc()).offset(skip).limit(limit).all()

        return CommentListResponse(total=total, comments=comments)

    def get_comment_by_id(self, comment_id: UUID) -> Optional[Comment]:
        """
        Retourne un commentaire s'il existe.
        """
        result = self._db.query(Comment).filter(Comment.id == comment_id).first()

        return result

    def delete_comment(self, comment_id: UUID) -> bool:
        """
        supprime un commentaire.
        """
        comment = self.get_comment_by_id(comment_id)
        if not comment:
            raise ValueError(f"Commentaire non trouvé.")

        self._db.delete(comment)
        self._db.commit()
        return True

    def get_comment_statistics(self) -> CommentStatsResponse:
        """
        Donne les statistiques des commentaires
        """
        total_comments = self._db.query(Comment).count()
        
        # Nombre de commentaire avec parent (réponse de commentaire)
        reply_count = self._db.query(Comment).filter(Comment.parent_id.isnot(None)).count()

        return CommentStatsResponse(
            total_comments=total_comments,
            reply_count=reply_count
        )

    