import enum

from sqlalchemy.orm import Session

from app.db.schemas.room import Room, RoomNames
from app.db.schemas.user import Levels, Years


class RoomService:
    def __init__(self, db: Session):
        self._db = db

    ROOM_MAPPING = {
        (Levels.PREPA, Years.PREMIERE_ANNEE): RoomNames.PREPA_1,
        (Levels.PREPA, Years.DEUXIEME_ANNEE): RoomNames.PREPA_2,
        (Levels.INGE, Years.PREMIERE_ANNEE): RoomNames.INGE_1,
        (Levels.INGE, Years.DEUXIEME_ANNEE): RoomNames.INGE_2,
        (Levels.INGE, Years.TROISIEME_ANNEE): RoomNames.INGE_3,
    }

    def get_user_room_id(self, level: Levels, year: Years):
        room_name = self.ROOM_MAPPING.get((level, year))

        if not room_name:
            return None

        room = self._db.query(Room).filter(Room.name == room_name).first()
        
        return room.id if room else None

        