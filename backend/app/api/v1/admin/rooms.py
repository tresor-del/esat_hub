from fastapi import APIRouter, Depends, HTTPException, status, Query
from app.api.deps.auth import get_current_admin
from app.api.deps.services import get_admin_service
from app.db.schemas.user import User
from app.services.admin.manager import AdminService
from app.models.room import RoomListResponse, RoomResponseAdmin, RoomStatsResponseAdmin


router = APIRouter()


@router.get("/rooms", response_model=RoomListResponse)
async def get_all_rooms(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne toutes les salles
    """
    result = admin_service.rooms.get_all_rooms(skip=skip, limit=limit)
    
    return result


@router.get("/rooms/statistics", response_model=RoomStatsResponseAdmin)
async def get_room_statistics(
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Donne les statitisques d'une salle pour l'admin
    """
    return admin_service.rooms.get_room_statistics()


@router.get("/rooms/{room_id}", response_model=RoomResponseAdmin)
async def get_room_by_id(
    room_id: int,
    admin: User = Depends(get_current_admin),
    admin_service: AdminService = Depends(get_admin_service),
):
    """
    Retourne une salle par id.
    """
    room = admin_service.rooms.get_room_by_id(room_id)
    if not room:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Salle non trouvée"
        )
    
    return RoomResponseAdmin(
        id=room.id,
        name=room.name,
        post_count=len(room.posts) if hasattr(room, 'posts') else 0,
        member_count=len(room.users) if hasattr(room, 'users') else 0
    )
