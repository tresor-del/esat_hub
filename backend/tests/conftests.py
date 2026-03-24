import pytest 
from sqlalchemy import create_engine


# Base de donnée sqlite en memmoire pour les tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

connect_args = {"check_same_thread": False}  # permet a plusieurs threads d'accéder à la même base de données en mémoire

# moteur sqlalchemy qui permet de se connecter à la base de donnée
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args=connect_args)

