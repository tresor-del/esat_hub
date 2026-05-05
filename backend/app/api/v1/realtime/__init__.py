from fastapi import APIRouter

from .ws import router as ws_router
from .chat import router as chat_router


router = APIRouter()

router.include_router(ws_router)
router.include_router(chat_router)