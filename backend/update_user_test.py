"""
Corrige les emails des comptes de test (domaine .local rejeté par Pydantic EmailStr).
À lancer une seule fois pour réparer les comptes déjà créés.
"""
from app.db.database import SessionLocal
from app.db.schemas.user import User

NEW_DOMAIN = "esathub-loadtest.com"

def main():
    db = SessionLocal()
    try:
        users = db.query(User).filter(User.email.like('%esathub-loadtest.local')).all()
        print(f"{len(users)} comptes à corriger")

        for user in users:
            local_part = user.email.split('@')[0]
            user.email = f"{local_part}@{NEW_DOMAIN}"

        db.commit()
        print("Emails corrigés.")
    finally:
        db.close()

if __name__ == "__main__":
    main()