from uuid import UUID

from sqlalchemy.orm import Session

from app.db.schemas.room import Room, RoomNames
from app.db.schemas.user import Level, Year
from app.models.room import RoomResponse
from app.db.schemas.media import Media
from app.models.media import MediaCreate, MediaUpdate, MediaListResponse, MediaResponse

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

    def get_user_room(self, user):
        room = None

        if user.user_room_id:
            room = self._db.query(Room).filter(Room.id == user.user_room_id).first()

        if not room:
            user_room_id = self.get_user_room_id(user.level, user.year)
            user.user_room_id = user_room_id
            self._db.commit()
            self._db.refresh(user)

            if user_room_id:
                room = self._db.query(Room).filter(Room.id == user_room_id).first()

        return RoomResponse.model_validate(room) if room else None

    def upload_room_media(self, data: MediaCreate) -> MediaResponse:
        db_media = Media(**data.model_dump())
        self._db.add(db_media)
        self._db.commit()
        self._db.refresh(db_media)
        return MediaResponse.model_validate(db_media)

    def get_room_media(self, room_id: UUID) -> MediaListResponse:
        media = self._db.query(Media).filter(Media.room_id == room_id).all()
        total = len(media)
        return MediaListResponse(total=total, media=media)

    def get_room_media_by_id(self, media_id: UUID) -> Media | None:
        return self._db.query(Media).filter(Media.id == media_id).first()

    def update_room_media(self, media_id: UUID, data: MediaUpdate) -> MediaResponse:
        db_media = self.get_room_media_by_id(media_id)
        if not db_media:
            return None

        update_data = data.model_dump(exclude_none=True)
        for field, value in update_data.items():
            setattr(db_media, field, value)

        self._db.commit()
        self._db.refresh(db_media)
        return MediaResponse.model_validate(db_media)

    def delete_room_media(self, media_id: UUID) -> None:
        db_media = self.get_room_media_by_id(media_id)
        if not db_media:
            return None

        self._db.delete(db_media)
        self._db.commit()
