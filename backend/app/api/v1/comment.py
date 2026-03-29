import uuid
from sqlalchemy.orm import Session
from fastapi import APIRouter, status, HTTPException, Depends

from app.dependencies import get_current_user, get_comment_service, get_post_service
from app.db.schemas.user import User
from app.services.comment import CommentService
from app.models.comment import CommentCreate
from app.services.posts import PostService
from app.services.users import AuthService
from app.models.message import Message

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

@router.post("/create")
def create_comment(
    data: CommentCreate,
    current_user: User = Depends(get_current_user),
    comment_service: CommentService = Depends(get_comment_service),
    post_service: PostService = Depends(get_post_service)
):
    
    post = post_service.get_post(post_id=data.post_id)

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    data.user_id = current_user.id

    result = comment_service.create_comment(data=data)
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
    
    if comment.user_id != current_user.id:
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
    if comment.user_id != current_user.id:
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