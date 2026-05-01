from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query, BackgroundTasks
from sqlalchemy.orm import Session

from app.api.deps.auth import get_current_admin
from app.api.deps.services import get_admin_service
from app.api.deps.db import get_db
from app.db.schemas.user import User
from app.services.admin.manager import AdminService
from app.models.notifications import NotificationResponse
from app.models.message import Message
from app.models.post import PostListResponse, PostStatsResponse
from app.db.schemas.post import Post
from app.tasks.notifications import send_notification_task


router = APIRouter()


@router.get("/posts", response_model=PostListResponse)
async def get_all_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    post_type: Optional[str] = Query(None, description="Filter by post type (GENERAL, ROOM, EVENT)"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, INACTIVE)"),
    room_id: Optional[str] = Query(None, description="Filter by room ID (use '0' for general posts)"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne tous les posts avec des filtres optionnel.
    """
    room_uuid = None
    if room_id and room_id != "0":
        try:
            room_uuid = UUID(room_id)
        except ValueError:
            pass
    
    result = admin_service.posts.get_all_posts(
        skip=skip,
        limit=limit,
        post_type=post_type,
        status=status,
        room_id=room_uuid if room_id else None
    )
    
    return result


@router.get("/posts/statistics", response_model=PostStatsResponse)
async def get_post_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne les stats d'un post
    """
    return admin_service.posts.get_post_statistics()

@router.get("/posts/{post_id}")
async def get_post_by_id(
    post_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne un post spécifique.
    """
    post = admin_service.posts.get_post_by_id(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post non trouvé."
        )
    
    return post

@router.delete("/posts/{post_id}", response_model=Message)
def delete_post(
    post_id: UUID,
    background_tasks: BackgroundTasks,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    db: Session = Depends(get_db),
):
    """
    Supprime un post puis envoie une notification à l'auteur.
    """
    try:
        post = admin_service.posts.get_post_by_id(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post non trouvé."
            )
        
        user = admin_service.users.get_user_by_id(post.user_id)
        
        # Supprimer le post
        admin_service.posts.delete_post(post_id)
        
        # Envoie de notif a l'auteur en arrière-plan
        if user:
            notification = NotificationResponse(
                type="POST_SUPPRIMÉ",
                content=f"Votre post '{post.title}' à été supprimé par un administateur.",
                is_read=False,
                recipient=admin_service.users.create_user_response(user),
                sender=admin_service.users.create_user_response(admin),
                post_id=post_id,
            )
            
            background_tasks.add_task(send_notification_task, notification)
        
        return Message(message="Post supprimé avec succès.")
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.patch("/posts/{post_id}/status", response_model=Message)
def update_post_status(
    post_id: UUID,
    background_tasks: BackgroundTasks,
    new_status: str = Query(..., description="New status (ACTIVE, INACTIVE)"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    db: Session = Depends(get_db),
):
    """
    Mettre à jour le statut d'un post.
    """
    try:
        post = admin_service.posts.get_post_by_id(post_id)
        user = admin_service.users.get_user_by_id(post.user_id)
        admin_service.posts.update_post_status(post_id, new_status)

        if user:
            notification = NotificationResponse(
                type="POST_STATUS_UPDATE",
                content=f"Un admin a changé le status de votre post '{post.title}' à {new_status}",
                is_read=False,
                recipient=admin_service.users.create_user_response(user),
                sender=admin_service.users.create_user_response(admin),
                post_id=post_id,
            )
            
            background_tasks.add_task(send_notification_task, notification)
        
        return Message(message="Statut mis à jour avec succès.")
    
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    