import firebase_admin
from firebase_admin import credentials

from app.core.config import settings

def init_firebase():
    """Initialise le SDK Firebase Admin au démarrage du serveur."""
    # Récupère le chemin depuis le fichier .env
    cred_path = settings.FIREBASE_CREDENTIALS_PATH
    
    if not firebase_admin._apps:
        cred = credentials.Certificate(cred_path)
        firebase_admin.initialize_app(cred)
        print(" SDK Firebase Admin initialisé avec succès !")
