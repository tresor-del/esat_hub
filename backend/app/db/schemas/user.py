import enum 
import uuid
from sqlalchemy import Boolean, Column, Date, Integer, String, Enum, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class Schools(str, enum.Enum):
    ESAT_TOGO = "ESAT_TOGO"

class Domains(str, enum.Enum):
    AERONAUTIQUE = "AERONAUTIQUE" 
    INFORMATIQUE = "INFORMATIQUE"

class Levels(str, enum.Enum):
    PREPA = "PREPA"
    INGE = "INGE"

class Types(str, enum.Enum):
    DELEGUE = "DELEGUE"
    SIMPLE = "SIMPLE"
    ADMIN = "ADMIN"

class Years(str, enum.Enum):
    PREMIERE_ANNEE = "1_ERE_ANNEE"
    DEUXIEME_ANNEE = "2_EME_ANNEE"
    TROISIEME_ANNEE = "3_EME_ANNEE"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    # unique=True crée déjà un index, donc index=True est techniquement redondant mais pas gênant
    profil_name = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    phone_number = Column(String, unique=True, index=True, nullable=True)
    birthday = Column(Date, nullable=True, index=True)
    card_number = Column(String, unique=True, nullable=True, index=True)

    type = Column(Enum(Types, name="types"), nullable=True, index=True, server_default=Years.PREMIERE_ANNEE.value)
    year = Column(Enum(Years, name="years"), nullable=True, index=True, server_default=Years.DEUXIEME_ANNEE.value)

    # Utilisation de server_default pour la cohérence avec la DB
    school_name = Column(
        Enum(Schools, name="schools"), 
        index=True, 
        nullable=False, 
        server_default=Schools.ESAT_TOGO.value
    )
    domain = Column(
        Enum(Domains, name="domains"), 
        index=True, 
        nullable=False, 
        server_default=Domains.INFORMATIQUE.value
    )
    level = Column(
        Enum(Levels, name="levels"), 
        index=True, 
        nullable=False, 
        server_default=Levels.PREPA.value
    )
    
    avatar_path = Column(String, nullable=True)
    qr_path = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, server_default=text("false"), default=False)


    # Relations
    posts = relationship(
        "Post",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    email_verification_tokens = relationship(
        "EmailVerificationToken",
        cascade="all, delete-orphan"
    )

    comments = relationship(
        "Comment",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    notifications = relationship(
            "Notification", 
            foreign_keys="Notification.recipient_id", 
            back_populates="recipient"
        )
    
    
    user_room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id"), index=True, nullable=True)
    user_room = relationship("Room", back_populates="users", foreign_keys=[user_room_id])

    room_rep = relationship("Room", back_populates="rep", foreign_keys="[Room.rep_id]")
