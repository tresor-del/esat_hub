"""
Seed de comptes de test pour le load testing d'EsatHub.
À lancer UNE SEULE FOIS depuis ton environnement backend (accès à app.db.database, app.db.security).

Usage: python seed_load_test_users.py
"""
import json
import uuid

# Adapte ces imports selon la structure réelle de ton projet
from app.db.database import SessionLocal
from app.db.security import hash_password
from app.db.schemas.user import User, UserRole, UserStatus, School, Domain, Level, Year, Major

NUM_USERS = 50
TEST_PASSWORD = "LoadTest_2026!"  # mot de passe unique pour tous les comptes de test
OUTPUT_FILE = "load_test_credentials.json"

def main():
    db = SessionLocal()
    credentials = []

    try:
        for i in range(1, NUM_USERS + 1):
            profil_name = f"loadtest{i}"
            username = f"{profil_name}@esat_togo"  # format confirmé par Trésor
            email = f"{profil_name}@esathub-loadtest.local"

            existing = db.query(User).filter(User.email == email).first()
            if existing:
                # déjà créé lors d'un run précédent, on récupère juste les identifiants
                credentials.append({"username": existing.username, "password": TEST_PASSWORD})
                continue

            user = User(
                id=uuid.uuid4(),
                first_name="Load",
                last_name=f"Test{i}",
                profil_name=profil_name,
                username=username,
                email=email,
                role=UserRole.STUDENT,
                major=Major.IA,
                status=UserStatus.ACTIVE,       # bypass la vérification email
                is_verified=True,
                year=Year.DEUXIEME_ANNEE,
                school_name=School.ESAT_TOGO,
                domain=Domain.INFORMATIQUE,
                level=Level.PREPA,
                hashed_password=hash_password(TEST_PASSWORD),
            )
            db.add(user)
            credentials.append({"username": username, "password": TEST_PASSWORD})

        db.commit()
        print(f"{NUM_USERS} comptes de test créés/vérifiés.")

    finally:
        db.close()

    with open(OUTPUT_FILE, "w") as f:
        json.dump(credentials, f, indent=2)
    print(f"Identifiants sauvegardés dans {OUTPUT_FILE}")

if __name__ == "__main__":
    main()