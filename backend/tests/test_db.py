from sqlalchemy import StaticPool, create_engine
from sqlalchemy.orm import sessionmaker

from app.db.database import Base

DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },
    poolclass=StaticPool
    
)

TestingSessionLocal = sessionmaker(autocommit=False)
Base.metadata.create_all(bind=engine)