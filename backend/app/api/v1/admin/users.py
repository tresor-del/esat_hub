from typing import  Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps.auth import get_current_admin
from app.api.deps.services import get_admin_service, get_notification_service
from app.db.schemas.user import User
from app.services.admin.manager import AdminService
from app.services.notification import NotificationService
from app.models.user import UserListResponse, UserResponse, UserSearchResponse
from app.models.notifications import NotificationResponse
from app.models.message import Message

router = APIRouter()

@router.get("/users/search", response_model=UserSearchResponse)
async def search_users(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Recher d'un utilisateur par nom, email, username ou nom de profil.
    """
    return admin_service.users.search_users(q, limit)


@router.get("/users", response_model=UserListResponse)
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    role: Optional[str] = Query(None, description="Filter by role (ADMIN, STUDENT, TEACHER)"),
    status: Optional[str] = Query(None, description="Filter by status (ACTIVE, PENDING, INACTIVE)"),
    domain: Optional[str] = Query(None, description="Filter by domain"),
    year: Optional[str] = Query(None, description="Filter by year"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    retourne tous les users avec des filtres optionnels.
    """
    result = admin_service.users.get_all_users(
        skip=skip,
        limit=limit,
        role=role,
        status=status,
        domain=domain,
        year=year
    )
    
    return result


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne un user specifique par id
    """
    user = admin_service.users.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    return admin_service.users.create_user_response(user)


@router.patch("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: UUID,
    new_status: str = Query(..., description="New status (ACTIVE, PENDING, INACTIVE)"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """
    Mettre à jour le statut d'un user et evoyer une notif.
    """
    try:
        user = admin_service.users.update_user_status(user_id, new_status)
        
        # Envoyer une notification a l'utilisateur
        try:
            notification = NotificationResponse(
                type="STATUS_UPDATE",
                content=f"Le Statut de votre compte est changé à {new_status}",
                is_read=False,
                recipient=admin_service.users.create_user_response(user),
                sender=admin_service.users.create_user_response(admin),
            )
            await notification_service.send_notification(notification)
        except Exception as e:
            print(f"Failed to send notification: {e}")
        
        return admin_service.users.create_user_response(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.patch("/users/{user_id}/role", response_model=UserResponse)
async def update_user_role(
    user_id: UUID,
    new_role: str = Query(..., description="New role (ADMIN, STUDENT, TEACHER)"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Update a user's role and send notification (admin only)."""
    try:
        user = admin_service.users.update_user_role(user_id, new_role)
        
        # Envoyer la notif.
        try:
            notification = NotificationResponse(
                type="ROLE_UPDATE",
                content=f"Le role de votre compte est changé à {new_role}",
                is_read=False,
                recipient=admin_service.users.create_user_response(user),
                sender=admin_service.users.create_user_response(admin),
            )
            await notification_service.send_notification(notification)
        except Exception as e:
            print(f"Failed to send notification: {e}")
        
        return admin_service.users.create_user_response(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.delete("/users/{user_id}", response_model=Message)
async def delete_user(
    user_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """
    Désactiver un user.
    """
    try:
        user = admin_service.users.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found"
            )
        
        # Un admin ne peut pas se désactiver
        if user_id == admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        admin_service.users.delete_user(user_id)
        
        # Send notification to the user
        try:
            notification = NotificationResponse(
                type="ACCOUNT_DELETED",
                content="Votre compte a été désactivé par un administrateur.",
                is_read=False,
                recipient=admin_service.users.create_user_response(user),
                sender=admin_service.users.create_user_response(admin),
            )
            await notification_service.send_notification(notification)
        except Exception as e:
            print(f"Failed to send notification: {e}")
        
        return Message(message="Utilisateur désactivé avec succès")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

