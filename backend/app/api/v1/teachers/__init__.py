from fastapi import APIRouter

from .assignments import router as asnmt_router
from .rooms import router as rooms_router

router = APIRouter(prefix="/teacher", tags=["Teacher"])

router.include_router(asnmt_router)
router.include_router(rooms_router)
