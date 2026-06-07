from fastapi import HTTPException
import jwt, io, qrcode, base64
from datetime import datetime, timedelta
from uuid import UUID, uuid4

from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.schemas.room import AttendanceRecord, CourseSession, Room, RoomNames, SessionStatus
from app.db.schemas.user import Level, User, Year
from app.models.room import RoomResponse
from app.db.schemas.media import Media
from app.models.media import MediaCreate, MediaUpdate, MediaListResponse, MediaResponse
from app.services.realtime import ws_manager

SECRET = settings.SECRET_KEY
QR_DURATION_MINUTES = 15
HOST = settings.FRONTEND_HOST


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

    # Les médias
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

    # Les présences
    def get_session(self, user):

        session = self._db.query(CourseSession).filter_by(
            room_id=user.user_room_id,
            status=SessionStatus.ACTIVE
        ).first()
        
        if session:
            return session
        else:
            return None

    def create_session(self, rep, course: str) -> dict:
        session_id = str(uuid4())
        expires_at = datetime.utcnow() + timedelta(minutes=QR_DURATION_MINUTES)

        # Token embarqué dans le QR
        token = jwt.encode({
            "session_id": session_id,
            "exp": expires_at,
            "type": "attendance"
        }, SECRET, algorithm="HS256")

        # Générer le QR base64 PNG
        url = f"{HOST}/scan?token={token}"
        img = qrcode.make(url)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()

        # Sauvegarder en base
        session = CourseSession(
            id=session_id,
            course=course,
            session_author_id=rep.id,
            qr_token=token,
            expires_at=expires_at,
            room_id=rep.user_room_id,
        )
        self._db.add(session); self._db.commit()

        return {"session_id": session_id, "qr_image": qr_b64, "expires_at": expires_at}

    async def mark_present(self, token: str, student_id: str) -> dict:
        try:
            payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        except jwt.ExpiredSignatureError:
            raise HTTPException(400, "QR Code expiré")
        except jwt.InvalidTokenError:
            raise HTTPException(400, "QR Code invalide")

        session = self._db.query(CourseSession).filter_by(
            id=payload["session_id"],
            status=SessionStatus.ACTIVE
        ).first()

        if not session:
            raise HTTPException(404, "Session introuvable ou fermée")

        # Vérifier doublon
        exists = self._db.query(AttendanceRecord).filter_by(
            session_id=session.id, student_id=student_id
        ).first()
        if exists:
            raise HTTPException(409, "Présence déjà enregistrée")

        record = AttendanceRecord(session_id=session.id, student_id=student_id)
        self._db.add(record); self._db.commit()

        # Broadcaster via WebSocket au prof en temps réel
        await ws_manager.broadcast_to_session(session.id, {
            "event": "NEW_ATTENDANCE",
            "student_id": student_id
        })

        return {"message": "Présence enregistrée"}
    
    def get_qr(self, session_id: str, rep_id: str) -> dict:
        """GET /sessions/{id}/qr — Prof récupère le QR d'une session existante"""
        session = self._db.query(CourseSession).filter_by(
            id=session_id,
            rep_id=rep_id  # sécurité : seul le prof propriétaire
        ).first()

        if not session:
            raise HTTPException(404, "Session introuvable")
        if session.status == SessionStatus.CLOSED:
            raise HTTPException(400, "Session déjà fermée")
        if datetime.utcnow() > session.expires_at:
            raise HTTPException(400, "QR Code expiré")

        # Regénérer l'image QR depuis le token stocké
        url = f"{HOST}/scan?token={session.qr_token}"
        img = qrcode.make(url)
        buf = io.BytesIO()
        img.save(buf, format="PNG")
        qr_b64 = base64.b64encode(buf.getvalue()).decode()

        return {
            "session_id": str(session.id),
            "qr_image": qr_b64,
            "expires_at": session.expires_at,
            "course": session.course,
        }

    def get_session_records(self, session_id: str, rep_id: str) -> list:
        """GET /sessions/{id}/records — Prof voit la liste des présents"""
        session = self._db.query(CourseSession).filter_by(
            id=session_id,
            rep_id=rep_id
        ).first()

        if not session:
            raise HTTPException(404, "Session introuvable")

        records = (
            self._db.query(AttendanceRecord, User)
            .join(User, AttendanceRecord.student_id == User.id)
            .filter(AttendanceRecord.session_id == session_id)
            .order_by(AttendanceRecord.scanned_at.asc())
            .all()
        )

        return [
            {
                "student_id": str(user.id),
                "profil_name": user.profil_name,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "scanned_at": record.scanned_at,
            }
            for record, user in records
        ]

    def close_session(self, session_id: str, rep_id: str) -> dict:
        """PATCH /sessions/{id}/close — Prof ferme la session"""
        session = self._db.query(CourseSession).filter_by(
            id=session_id,
            rep_id=rep_id
        ).first()

        if not session:
            raise HTTPException(404, "Session introuvable")
        if session.status == SessionStatus.CLOSED:
            raise HTTPException(400, "Session déjà fermée")

        session.status = SessionStatus.CLOSED
        self._db.commit()

        # Compter les présents pour le résumé final
        total_present = self._db.query(AttendanceRecord).filter_by(
            session_id=session_id
        ).count()

        return {
            "message": "Session fermée",
            "session_id": session_id,
            "total_present": total_present,
        }


