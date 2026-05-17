import enum 
import uuid
from sqlalchemy import Boolean, Column, Date, Integer, String, Enum, text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class School(str, enum.Enum):
    ESAT_TOGO = "ESAT_TOGO"

class Domain(str, enum.Enum):
    AERONAUTIQUE = "AERONAUTIQUE" 
    INFORMATIQUE = "INFORMATIQUE"

class Level(str, enum.Enum):
    PREPA = "PREPA"
    INGE = "INGE"

class Year(str, enum.Enum):
    PREMIERE_ANNEE = "PREMIERE_ANNEE"
    DEUXIEME_ANNEE = "DEUXIEME_ANNEE"
    TROISIEME_ANNEE = "TROISIEME_ANNEE"

class Major(str, enum.Enum):
    IA = "IA"
    CYBERSECURITE = "CYBERSECURITE"
    GENIE_LOGICIEL = "GENIE LOGICIEL"
    GENIE_MECANIQUE = "GENIE MECANIQUE"
    DATA_SCIENCE = "DATA SCIENCE"
    RESEAUX_TELECOMS = "RESEAUX & TELECOMS"
    SYSTEMES_EMBARQUES = "SYSTEMES EMBARQUES"
    PROPULSION = "PROPULSION"
    MAINTENANCE_AERONAUTIQUE = "MAINTENANCE AERONAUTIQUE"
    CONCEPTION_AEROSPATIALE = "CONCEPTION AEROSPATIALE"


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    STUDENT = "STUDENT"
    SCHOOL_ADMIN = "SCHOOL_ADMIN"
    TEACHER = "TEACHER"

class UserStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    PENDING = "PENDING"
    INACTIVE = "INACTIVE"

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

    role = Column(Enum(UserRole, name="userrole", values_callable=lambda x: [e.value for e in x]), nullable=True, index=True, server_default=UserRole.STUDENT.value)
    major = Column(Enum(Major, name="major", values_callable=lambda x: [e.value for e in x]), nullable=True, index=True, server_default=Major.IA.value)

    status = Column(Enum(UserStatus, name="status", values_callable=lambda x: [e.value for e in x]), nullable=True, index=True, server_default=UserStatus.PENDING.value)

    year = Column(Enum(Year, name="year", values_callable=lambda x: [e.value for e in x]), nullable=True, index=True, server_default=Year.DEUXIEME_ANNEE.value)
    
    avatar_path = Column(String, nullable=True)
    qr_path = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, server_default=text("false"), default=False)


    # Relations
    posts = relationship("Post", back_populates="user",cascade="all, delete-orphan")

    email_verification_tokens = relationship("EmailVerificationToken",cascade="all, delete-orphan")

    comments = relationship("Comment", back_populates="user", cascade="all, delete-orphan")

    notifications = relationship("Notification", foreign_keys="Notification.recipient_id", back_populates="recipient")
    
    
    user_room_id = Column(UUID(as_uuid=True), ForeignKey("rooms.id", use_alter=True), index=True, nullable=True)
    user_room = relationship("Room", back_populates="users", foreign_keys=[user_room_id])

    room_rep = relationship("Room", back_populates="rep", foreign_keys="[Room.rep_id]")

    sent_messages = relationship("Message", foreign_keys="[Message.sender_id]", back_populates="sender")
    received_messages = relationship("Message", foreign_keys="[Message.recipient_id]", back_populates="recipient")


    devices = relationship("UserDevice", back_populates="user", cascade="all, delete-orphan")

    # POUR LES ENSEIGNANTS
    teachs = Column(String, nullable=True)
    full_name = Column(String, nullable=True)

    school_name = Column(
        Enum(School, name="school", values_callable=lambda x: [e.value for e in x]), 
        index=True, 
        nullable=False, 
        server_default=School.ESAT_TOGO.value
    )
    domain = Column(
        Enum(Domain, name="domain", values_callable=lambda x: [e.value for e in x]), 
        index=True, 
        nullable=False, 
        server_default=Domain.INFORMATIQUE.value
    )
    level = Column(
        Enum(Level, name="level", values_callable=lambda x: [e.value for e in x]), 
        index=True, 
        nullable=False, 
        server_default=Level.PREPA.value
    )