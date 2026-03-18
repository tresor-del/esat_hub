import enum 
import uuid
from sqlalchemy import Boolean, Column, String, Enum, text 
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class Schools(str, enum.Enum):
    ESAT_TOGO = "ESAT_TOGO"

class Domains(str, enum.Enum):
    AERONAUTIQUE = "AERONAUTIQUE" # Valeurs simplifiées pour la DB
    INFORMATIQUE = "INFORMATIQUE"

class Levels(str, enum.Enum):
    PREPA = "PREPA"
    INGE = "INGE"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, index=True, default=uuid.uuid4)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    # unique=True crée déjà un index, donc index=True est techniquement redondant mais pas gênant
    profil_name = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)

    # Utilisation de server_default pour la cohérence avec la DB
    school_name = Column(
        Enum(Schools, name="schools"), 
        index=True, 
        nullable=False, 
        server_default="ESAT_TOGO"
    )
    domain = Column(
        Enum(Domains, name="domains"), 
        index=True, 
        nullable=False, 
        server_default="INFORMATIQUE"
    )
    level = Column(
        Enum(Levels, name="levels"), 
        index=True, 
        nullable=False, 
        server_default="PREPA"
    )
    
    avatar_path = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_verified = Column(Boolean, server_default=text("false"), default=False)


    # Relations
    posts = relationship(
        "Post",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    comments = relationship(
        "Comment",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    email_verification_tokens = relationship(
        "EmailVerificationToken",
        cascade="all, delete-orphan"
    )

    sender_message = relationship(
        "Message",
        back_populates="user_sender",
        cascade="all, delete-orphan"
    )

    receiver_message = relationship(
        "Message",
        back_populates="user_receiver",
        cascade="all, delete-orphan"
    )
