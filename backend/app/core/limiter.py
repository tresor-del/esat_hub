from slowapi import Limiter
from slowapi.util import get_remote_address

# On crée l'instance ici, elle sera partagée par toute l'appli
limiter = Limiter(key_func=get_remote_address)
