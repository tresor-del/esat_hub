from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps.auth import  get_current_admin
from app.api.deps.services import get_admin_service, get_notification_service
from app.db.schemas.user import User
from app.services.admin.manager import AdminService
from app.services.notification import NotificationService
from app.models.notifications import NotificationResponse
from app.models.comment import CommentListResponse, CommentResponse, CommentStatsResponse
from app.models.message import Message
from app.db.schemas.comments import Comment

router = APIRouter()

@router.get("/comments/statistics", response_model=CommentStatsResponse)
async def get_comment_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Donne les statistiques sur les commentaires
    """
    return admin_service.comments.get_comment_statistics()

@router.get("/comments", response_model=CommentListResponse)
async def get_all_comments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    post_id: Optional[int] = Query(None, description="Filtre par post_id"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne tous les commentaires avec des filtres optionnel.
    """
    result = admin_service.comments.get_all_comments(
        skip=skip,
        limit=limit,
        post_id=post_id
    )
    
    return result


@router.get("/comments/{comment_id}")
async def get_comment_by_id(
    comment_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne un commentaire s'il existe.
    """
    comment = admin_service.comments.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Commentaire non trouvé"
        )
    
    return comment

@router.delete("/comments/{comment_id}", response_model=Message)
async def delete_comment(
    comment_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """
    Supprime un commentaire puis envoie une notification à l'auteur
    """
    try:
        comment = admin_service.comments.get_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Commentaire non trouvé"
            )
        
        user = admin_service.users.get_user_by_id(comment.user_id)
        
        # supprimer le commentaire
        admin_service.comments.delete_comment(comment_id)
        
        # Envoie une notification à l'auteur du commentaire
        if user:
            try:
                notification = NotificationResponse(
                    type="COMMENTAIRE_SUPPRIMÉ",
                    content="Un administrateur à supprimé votre commentaire",
                    is_read=False,
                    recipient=admin_service.create_user_response(user),
                    sender=admin_service.create_user_response(admin),
                    comment_id=comment_id,
                )
                await notification_service.send_notification(notification)
            except Exception as e:
                print(f"Erreur lors de l'envoie de notification: {e}")
        
        return Message(message=f"Commentaire {comment_id} supprimé avec succès")
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

