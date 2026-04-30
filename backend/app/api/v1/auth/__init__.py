from fastapi import APIRouter
from .auth import router as auth_router

router = APIRouter(prefix="/auth", tags=["auth"])

router.include_router(auth_router)

