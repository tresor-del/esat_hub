from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# moteur sqlalchemy qui permet de se connecter à la base de donnée
engine = create_engine(settings.SQLALCHEMY_DATABASE_URI)

# permet de créer des sessions de base de données pour les requêtes
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# classe de base pour les modèles et les tables de la base de données
Base = declarative_base()