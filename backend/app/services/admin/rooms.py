from typing import Optional
from uuid import UUID
from app.db.schemas.room import Room
from app.services.admin.base import BaseAdminService
from app.models.room import RoomListResponse, RoomResponseAdmin, RoomStatsResponseAdmin
from app.db.schemas.user import User


class AdminRoomsService(BaseAdminService):

    def get_all_rooms(self, skip: int = 0, limit: int = 100) -> RoomListResponse:
        """
        Retourne toutes les salles
        """
        query = self._db.query(Room)
        total = query.count()
        rooms = query.order_by(Room.name).offset(skip).limit(limit).all()
        return RoomListResponse(total=total, rooms=rooms)

    def get_room_by_id(self, room_id: UUID) -> Optional[RoomResponseAdmin]:
        """
        retourne une salle par l'id
        """
        room =  self._db.query(Room).filter(Room.id == room_id).first()
        
        return RoomResponseAdmin(
            id=room.id,
            name=room.name,
            member_count= len(room.users) if hasattr(room, "users") else 0,
            post_count= len(room.posts) if hasattr(room, "posts") else 0
        )
        
    def get_room_statistics(self) -> RoomStatsResponseAdmin:
        """
        Retourne les statistiques d'une salle
        """
        total_rooms = self._db.query(Room).count()
        
        room_counts = []
        rooms = self._db.query(Room).all()
        for room in rooms:
            post_count = len(room.posts) if hasattr(room, 'posts') else 0
            member_count = len(room.users) if hasattr(room, 'users') else 0
            room_counts.append(RoomResponseAdmin(
                id=room.id,
                name=room.name,
                post_count=post_count,
                member_count=member_count
            ))

        return RoomStatsResponseAdmin(
            total_rooms=total_rooms,
            rooms=room_counts
        )
    
    def set_room_rep(self, user_id: UUID):

        user = self._db.query(User).filter(User.id == user_id).first()
        room =  self._db.query(Room).filter(Room.id == user.user_room_id).first()

        room.rep_id = user_id
        user.is_room_rep = True
        self._db.commit()
        self._db.refresh(room)
        self._db.refresh(user)

        print(user.is_room_rep)

        return room.rep_id