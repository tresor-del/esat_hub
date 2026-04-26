from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps.auth import get_current_admin
from app.api.deps.services import get_admin_service, get_notification_service
from app.db.schemas.user import User
from app.services.admin.manager import AdminService
from app.services.notification import NotificationService
from app.models.notifications import NotificationResponse

router = APIRouter()


@router.get("/posts", response_model=dict)
async def get_all_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    post_type: Optional[str] = Query(None, description="Filter by post type"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get all posts with optional filters (admin only)."""
    posts, total = admin_service.posts.get_all_posts(
        skip=skip,
        limit=limit,
        post_type=post_type
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

