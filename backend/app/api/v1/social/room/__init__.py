from fastapi import APIRouter

from .attendance import router as attendance_router
from .media import router as media_router
# from .members import router as members_router
from .main import router as main_router
from .rfid import router as rfid_router
from .assignments import router as asnmt_router


router = APIRouter()

router.include_router(attendance_router)
router.include_router(media_router)
router.include_router(asnmt_router)
router.include_router(main_router)
router.include_router(rfid_router)