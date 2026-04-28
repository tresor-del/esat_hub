from typing import Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.deps.auth import get_current_admin
from app.api.deps.services import get_admin_service, get_notification_service
from app.db.schemas.user import User
from app.services.admin.manager import AdminService
from app.services.notification import NotificationService
from app.models.notifications import NotificationResponse
from app.models.message import Message
from app.models.post import PostListResponse, PostResponse, PostUpdateResponse


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
    """Get all posts with optional filters (admin only)."""
    room_uuid = None
    if room_id and room_id != "0":
        try:
            room_uuid = UUID(room_id)
        except ValueError:
            pass
    
    posts, total = admin_service.posts.get_all_posts(
        skip=skip,
        limit=limit,
        post_type=post_type,
        status=status,
        room_id=room_uuid if room_id else None
    )
    
    return {
        "total": total,
        "posts": posts
    }


@router.get("/posts/statistics", response_model=dict)
async def get_post_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get post statistics (admin only)."""
    return admin_service.posts.get_post_statistics()

@router.get("/posts/{post_id}")
async def get_post_by_id(
    post_id: int,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get a specific post by ID (admin only)."""
    post = admin_service.posts.get_post_by_id(post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Post {post_id} not found"
        )
    
    return post

@router.delete("/posts/{post_id}")
async def delete_post(
    post_id: int,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Delete a post and send notification to the author (admin only)."""
    try:
        post = admin_service.posts.get_post_by_id(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post {post_id} not found"
            )
        
        user = admin_service.users.get_user_by_id(post.user_id)
        
        # Delete the post
        admin_service.posts.delete_post(post_id)
        
        # Send notification to the post user
        if user:
            try:
                notification = NotificationResponse(
                    type="POST_DELETED",
                    content=f"Your post '{post.title}' has been deleted by an administrator",
                    is_read=False,
                    recipient=admin_service.users.create_user_response(user),
                    sender=admin_service.users.create_user_response(admin),
                    post_id=post_id,
                )
                await notification_service.send_notification(notification)
            except Exception as e:
                print(f"Failed to send notification: {e}")
        
        return {"message": f"Post {post_id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

@router.patch("/posts/{post_id}/status")
async def update_post_status(
    post_id: int,
    new_status: str = Query(..., description="New status (ACTIVE, INACTIVE)"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Update a post's status (admin only)."""
    try:
        post = admin_service.posts.get_post_by_id(post_id)
        user = admin_service.users.get_user_by_id(post.user_id)
        admin_service.posts.update_post_status(post_id, new_status)

        if user:
            try:
                notification = NotificationResponse(
                    type="POST_STATUS_UPDATE",
                    content=f"Un admin a changé le status de votre post '{post.title}' à {new_status}",
                    is_read=False,
                    recipient=admin_service.users.create_user_response(user),
                    sender=admin_service.users.create_user_response(admin),
                    post_id=post_id,
                )
                await notification_service.send_notification(notification)
            except Exception as e:
                print(f"Failed to send notification: {e}")
        

        return Message(message="Post status updated successfully")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    