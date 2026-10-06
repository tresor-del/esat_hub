import json

from app.db.database import SessionLocal
from app.db.schemas.user import User

INPUT_FILE = "load_test_credentials.json"
OUTPUT_FILE = "load_test_credentials.json"  # écrase le même fichier

def main():
    db = SessionLocal()
    try:
        with open(INPUT_FILE) as f:
            credentials = json.load(f)

        updated = 0
        for cred in credentials:
            if "id" in cred:
                continue  # déjà complété

            user = db.query(User).filter(User.username == cred["username"]).first()
            if user:
                cred["id"] = str(user.id)
                updated += 1
            else:
                print(f"Utilisateur introuvable pour {cred['username']}")

        with open(OUTPUT_FILE, "w") as f:
            json.dump(credentials, f, indent=2)

        print(f"{updated} comptes complétés avec leur id.")
    finally:
        db.close()

if __name__ == "__main__":
    main()