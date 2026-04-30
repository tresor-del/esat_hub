from fastapi import APIRouter

from .admin import router as admin_router
from .auth import router as auth_router
from .interactions import router as inter_router
from .realtime import router as rt_router
from .social import router as social_router
from .common import router as c_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(admin_router)
router.include_router(inter_router)
router.include_router(rt_router)
router.include_router(social_router)
router.include_router(c_router)
