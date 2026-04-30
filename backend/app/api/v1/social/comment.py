import uuid
from sqlalchemy.orm import Session
from fastapi import APIRouter, status, HTTPException, Depends, BackgroundTasks

from app.api.deps.auth import get_current_user
from app.api.deps.services import get_comment_service, get_post_service, get_auth_service
from app.api.deps.db import get_db
from app.db.schemas.user import User
from app.services.social.comment import CommentService
from app.models.comment import CommentCreate
from app.services.social.posts import PostService
from app.models.message import Message
from app.models.user import UserResponse
from app.models.notifications import NotificationResponse
from app.services.auth.users import AuthService
from app.tasks.notifications import send_notification_task
from app.core.notifications import notification_contents

router = APIRouter(prefix="/comments", tags=["comments"])

@router.get("/{comment_id}")
def get_comment(
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(get_comment_service)
):
    comment = comment_service.get_comment(comment_id=comment_id)

    if not comment:
        raise HTTPException(
            status_code=404,
            detail = "Comment not found"
        )
    
    return comment

@router.post("/create", status_code=status.HTTP_201_CREATED)
def create_comment(
    data: CommentCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(get_comment_service),
    post_service: PostService = Depends(get_post_service),
    auth_service: AuthService = Depends(get_auth_service),
    db: Session = Depends(get_db),
):
    
    post = post_service.get_post(post_id=data.post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    data.user_id = current_user.id

    result = comment_service.create_comment(data=data)

    # Envoyer une notification au propriétaire du post en arrière-plan
    post = post_service.get_post(data.post_id)
    sender = auth_service.get_user(current_user.id)
    
    # Notification pour les commentaires parents
    if data.parent_id is None: 
        recipient = auth_service.get_user(post.user_id)

        content = notification_contents.new_comment(
            username=current_user.username,
            post_title=post.title,
            comment_preview=result.content[:50],
            is_reply=False
        )

        notification_data = NotificationResponse(
            type="new_comment",
            content=content,
            is_read=False,
            recipient=UserResponse.model_validate(recipient),
            sender=UserResponse.model_validate(sender),
            post_id=data.post_id,
            comment_id=result.id
        )

    # Notification pour les réponses aux commentaires
    else:
        parent_comment = comment_service.get_comment(result.parent_id)
        recipient = parent_comment.user
        content = notification_contents.new_comment(
            username=current_user.username,
            post_title=post.title,
            comment_preview=result.content[:50],
            is_reply=True
        )
        notification_data = NotificationResponse(
            type="new_comment",
            content=content,
            is_read=False,
            recipient=recipient,
            sender=UserResponse.model_validate(sender),
            post_id=data.post_id,
            comment_id=result.id
        )
    
    # Ajouter la tâche de notification en arrière-plan
    background_tasks.add_task(send_notification_task, notification_data)

    return result

@router.put("/update/{comment_id}")
def update_comment(
    comment_id: uuid.UUID,
    new_content: str,
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(get_comment_service)
):
    comment = comment_service.get_comment(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    if comment.user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed"
        )

    result = comment_service.update_comment(comment_id, new_content)
    return result

@router.delete("/delete/{comment_id}")
def delete_comment(
    comment_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(get_comment_service)
):
    comment = comment_service.get_comment(comment_id)
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    if comment.user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not allowed"
        )
    
    result = comment_service.delete_comment(comment_id)
    if result:
        return Message(message="Comment deleted successfully")

@router.get("/posts/{post_id}/comments")
def get_post_comments(
    post_id: int,
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(get_comment_service),
    post_service: PostService = Depends(get_post_service)
):
    post = post_service.get_post(post_id=post_id)
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    comments = comment_service.get_comments(post_id)

    return comments