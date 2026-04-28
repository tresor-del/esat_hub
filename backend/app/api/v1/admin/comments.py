from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.api.deps.auth import  get_current_admin
from app.api.deps.services import get_admin_service, get_notification_service
from app.db.schemas.user import User
from app.services.admin.manager import AdminService
from app.services.notification import NotificationService
from app.models.user import UserResponse
from app.models.notifications import NotificationResponse

router = APIRouter()

@router.get("/comments/statistics", response_model=dict)
async def get_comment_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get comment statistics (admin only)."""
    return admin_service.comments.get_comment_statistics()

@router.get("/comments")
async def get_all_comments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    post_id: Optional[int] = Query(None, description="Filter by post ID"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get all comments with optional filters (admin only)."""
    comments, total = admin_service.comments.get_all_comments(
        skip=skip,
        limit=limit,
        post_id=post_id
    )
    
    return {
        "total": total,
        "comments": comments
    }


@router.get("/comments/{comment_id}")
async def get_comment_by_id(
    comment_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get a specific comment by ID (admin only)."""
    comment = admin_service.comments.get_comment_by_id(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Comment {comment_id} not found"
        )
    
    return comment

@router.delete("/comments/{comment_id}")
async def delete_comment(
    comment_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Delete a comment and send notification to the author (admin only)."""
    try:
        comment = admin_service.comments.get_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Comment {comment_id} not found"
            )
        
        user = admin_service.users.get_user_by_id(comment.user_id)
        
        # Delete the comment
        admin_service.comments.delete_comment(comment_id)
        
        # Send notification to the comment author
        if user:
            try:
                notification = NotificationResponse(
                    type="COMMENT_DELETED",
                    content="Your comment has been deleted by an administrator",
                    is_read=False,
                    recipient=admin_service.create_user_response(user),
                    sender=admin_service.create_user_response(admin),
                    comment_id=comment_id,
                )
                await notification_service.send_notification(notification)
            except Exception as e:
                print(f"Failed to send notification: {e}")
        
        return {"message": f"Comment {comment_id} deleted successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )

