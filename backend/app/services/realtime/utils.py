from cryptography.fernet import Fernet
from app.core.config import settings


cipher = Fernet(settings.ENCRYPTION_KEY)

def encrypt(text: str) -> str:
    return cipher.encrypt(text.encode()).decode()

def decrypt(text: str) -> str:
    try:
        return cipher.decrypt(text.encode()).decode()
    except Exception:
        # Message ancien, déjà en clair
        return text