from typing import List, Optional
from app.db.schemas.room import Room
from app.services.admin.base import BaseAdminService


class AdminRoomsService(BaseAdminService):

    def get_all_rooms(self, skip: int = 0, limit: int = 100) -> tuple[List[Room], int]:
        """Get all rooms with member and post counts."""
        query = self._db.query(Room)
        total = query.count()
        rooms = query.order_by(Room.name).offset(skip).limit(limit).all()
        return rooms, total

    def get_room_by_id(self, room_id: int) -> Optional[Room]:
        """Get a room by ID."""
        return self._db.query(Room).filter(Room.id == room_id).first()

    def get_room_statistics(self) -> dict:
        """Get room statistics."""
        total_rooms = self._db.query(Room).count()
        
        # Get room with post count
        room_counts = []
        rooms = self._db.query(Room).all()
        for room in rooms:
            post_count = len(room.posts) if hasattr(room, 'posts') else 0
            member_count = len(room.users) if hasattr(room, 'users') else 0
            room_counts.append({
                "id": room.id,
                "name": room.name,
                "post_count": post_count,
                "member_count": member_count
            })

        return {
            "total_rooms": total_rooms,
            "rooms": room_counts
        }