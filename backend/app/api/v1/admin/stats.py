from fastapi import APIRouter, Depends

from app.api.deps.auth import  get_current_admin
from app.api.deps.services import get_admin_service
from app.db.schemas.user import User
from app.services.admin.manager import AdminService

router = APIRouter()

@router.get("/statistics", response_model=dict)
async def get_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """Get overall statistics (admin only)."""
    return admin_service.stats.get_statistics()
