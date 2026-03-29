import datetime
from sqlalchemy import Column, Integer, String, DateTime

from app.db.database import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"

    id = Column(Integer, primary_key=True)
    # id jwt
    jti = Column(String, unique=True, index=True, nullable=False)
    revoked_at = Column(DateTime, default=datetime.datetime.now(datetime.UTC))