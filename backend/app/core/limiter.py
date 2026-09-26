from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import settings

redis_storage_url = settings.REDIS_URL

# On crée l'instance ici, elle sera partagée par toute l'appli
limiter = Limiter(key_func=get_remote_address, storage_uri=redis_storage_url)
