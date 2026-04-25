import enum
from uuid import UUID

from sqlalchemy.orm import Session

from app.db.schemas.room import Room, RoomNames
from app.db.schemas.user import Level, Year
from app.models.room import RoomResponse

class RoomService:
    def __init__(self, db: Session):
        self._db = db

    ROOM_MAPPING = {
        (Level.PREPA, Year.PREMIERE_ANNEE): RoomNames.PREPA_1,
        (Level.PREPA, Year.DEUXIEME_ANNEE): RoomNames.PREPA_2,
        (Level.INGE, Year.PREMIERE_ANNEE): RoomNames.INGE_1,
        (Level.INGE, Year.DEUXIEME_ANNEE): RoomNames.INGE_2,
        (Level.INGE, Year.TROISIEME_ANNEE): RoomNames.INGE_3,
    }

    def get_user_room_id(self, level: Level, year: Year):
        room_name = self.ROOM_MAPPING.get((level, year))

        if not room_name:
            return None

        room = self._db.query(Room).filter(Room.name == room_name).first()
        
        return room.id if room else None

    def get_user_room(self, room_id: UUID):
        room = self._db.query(Room).filter(Room.id == room_id).first()

        users = room.users
        for user in users:
            print(user.username)

        return room


        