from fastapi import APIRouter

from .comment import router as comment_router
from .post import router as post_router
from .room import router as room_router
from .users import router as user_router

router = APIRouter()

router.include_router(comment_router)
router.include_router(post_router)
router.include_router(room_router)
router.include_router(user_router)