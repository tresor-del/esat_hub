from fastapi import APIRouter
from . import users, comments, stats, posts

router = APIRouter(tags=["Admin"], prefix="/admin")

router.include_router(users.router, tags=["Admin Users"])
router.include_router(comments.router, tags=["Admin Comments"])
router.include_router(stats.router, tags=["Admin Stats"])
router.include_router(posts.router, tags=["Admin Posts"])
