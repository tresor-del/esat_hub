from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.dependencies import get_db, get_current_admin, get_admin_service
from app.db.schemas.user import User, UserRole, UserStatus
from app.db.schemas.post import Post
from app.db.schemas.comments import Comment
from app.services.admin import AdminService
from app.services.notification import NotificationService
from app.models.user import UserResponse
from app.models.notifications import NotificationResponse


router = APIRouter(prefix="/admin", tags=["Admin"])


def get_notification_service(db: Session = Depends(get_db)) -> NotificationService:
    """Dependency to get notification service."""
    return NotificationService(db)


@router.get("/users/search", response_model=dict)
async def search_users(
    q: str = Query(..., min_length=1, description="Search query"),
    limit: int = Query(50, ge=1, le=100),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Search users by name, email, username, or profile name (admin only)."""
    users = admin_service.search_users(q, limit)
    return {
        "query": q,
        "results": [admin_service.create_user_response(u) for u in users]
    }


@router.get("/posts/statistics", response_model=dict)
async def get_post_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get post statistics (admin only)."""
    return admin_service.get_post_statistics()

@router.get("/comments/statistics", response_model=dict)
async def get_comment_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get comment statistics (admin only)."""
    return admin_service.get_comment_statistics()


@router.get("/users", response_model=dict)
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
    """Get all users with optional filters (admin only)."""
    users, total = admin_service.get_all_users(
        skip=skip,
        limit=limit,
        role=role,
        status=status,
        domain=domain,
        year=year
    )
    
    return {
        "total": total,
        "users": [admin_service.create_user_response(u) for u in users]
    }


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get a specific user by ID (admin only)."""
    user = admin_service.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    return admin_service.create_user_response(user)


@router.patch("/users/{user_id}/status", response_model=UserResponse)
async def update_user_status(
    user_id: UUID,
    new_status: str = Query(..., description="New status (ACTIVE, PENDING, INACTIVE)"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Update a user's status and send notification (admin only)."""
    try:
        user = admin_service.update_user_status(user_id, new_status)
        
        # Send notification to the user
        try:
            notification = NotificationResponse(
                type="STATUS_UPDATE",
                content=f"Your account status has been updated to {new_status}",
                is_read=False,
                recipient=admin_service.create_user_response(user),
                sender=admin_service.create_user_response(admin),
            )
            await notification_service.send_notification(notification)
        except Exception as e:
            print(f"Failed to send notification: {e}")
        
        return admin_service.create_user_response(user)
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
        user = admin_service.update_user_role(user_id, new_role)
        
        # Send notification to the user
        try:
            notification = NotificationResponse(
                type="ROLE_UPDATE",
                content=f"Your account role has been updated to {new_role}",
                is_read=False,
                recipient=admin_service.create_user_response(user),
                sender=admin_service.create_user_response(admin),
            )
            await notification_service.send_notification(notification)
        except Exception as e:
            print(f"Failed to send notification: {e}")
        
        return admin_service.create_user_response(user)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )


@router.delete("/users/{user_id}")
async def delete_user(
    user_id: UUID,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
    notification_service: NotificationService = Depends(get_notification_service),
):
    """Delete (deactivate) a user and send notification (admin only)."""
    try:
        user = admin_service.get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User {user_id} not found"
            )
        
        # Don't allow self-deletion
        if user_id == admin.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete your own account"
            )
        
        admin_service.delete_user(user_id)
        
        # Send notification to the user
        try:
            notification = NotificationResponse(
                type="ACCOUNT_DELETED",
                content="Your account has been deactivated by an administrator",
                is_read=False,
                recipient=admin_service.create_user_response(user),
                sender=admin_service.create_user_response(admin),
            )
            await notification_service.send_notification(notification)
        except Exception as e:
            print(f"Failed to send notification: {e}")
        
        return {"message": f"User {user_id} deactivated successfully"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )




@router.get("/posts", response_model=dict)
async def get_all_posts(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    post_type: Optional[str] = Query(None, description="Filter by post type"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get all posts with optional filters (admin only)."""
    posts, total = admin_service.get_all_posts(
        skip=skip,
        limit=limit,
        post_type=post_type
    )
    
    return {
        "total": total,
        "posts": posts
    }


@router.get("/posts/{post_id}")
async def get_post_by_id(
    post_id: int,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get a specific post by ID (admin only)."""
    post = admin_service.get_post_by_id(post_id)
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
        post = admin_service.get_post_by_id(post_id)
        if not post:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Post {post_id} not found"
            )
        
        user = admin_service.get_user_by_id(post.user_id)
        
        # Delete the post
        admin_service.delete_post(post_id)
        
        # Send notification to the post user
        if user:
            try:
                notification = NotificationResponse(
                    type="POST_DELETED",
                    content=f"Your post '{post.title}' has been deleted by an administrator",
                    is_read=False,
                    recipient=admin_service.create_user_response(user),
                    sender=admin_service.create_user_response(admin),
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



@router.get("/comments", response_model=dict)
async def get_all_comments(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    post_id: Optional[int] = Query(None, description="Filter by post ID"),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get all comments with optional filters (admin only)."""
    comments, total = admin_service.get_all_comments(
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
    comment = admin_service.get_comment_by_id(comment_id)
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
        comment = admin_service.get_comment_by_id(comment_id)
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Comment {comment_id} not found"
            )
        
        user = admin_service.get_user_by_id(comment.user_id)
        
        # Delete the comment
        admin_service.delete_comment(comment_id)
        
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


# ============================================
# Statistics Route
# ============================================

@router.get("/statistics", response_model=dict)
async def get_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get overall statistics (admin only)."""
    return admin_service.get_statistics()