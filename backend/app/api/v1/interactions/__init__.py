from fastapi import APIRouter

from .notification import router as notif_router
from .search import router as search_router

router = APIRouter()

router.include_router(notif_router)
router.include_router(search_router)