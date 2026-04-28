import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from contextlib import asynccontextmanager

from app.core.logging import setup_logging
from app.db.database import Base, engine
from app.api.v1.auth import router as auth_router
from app.api.v1.post import router as post_router
from app.api.v1.users import router as users_router
from app.api.v1.search import router as search_router
from app.api.v1.files import router as files_router
from app.api.v1.comment import router as comment_router
from app.api.v1.ws import router as ws_router
from app.api.v1.notification import router as notif_router
from app.api.v1.room import router as room_router
from app.api.v1.admin import router as admin_router
from app.core.config import settings
from app.core.limiter import limiter


setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connexion à l'api...")
    yield
    logger.info("Fermerture des connexions...")
    # à la création de engine, l'app crée une pool pour et stock des tuyaux ouverts vers la base de données. 
    # ça permet de réutiliser ces tuyaux pour les requêtes suivantes sans devoir se reconnecter à chaque fois, ce qui améliore les performances.
    # Quand l'app se ferme, il faut fermer ces tuyaux pour libérer les ressources
    engine.dispose()
    

app = FastAPI(title=settings.APP_NAME)

# Configuration CORS - Restreint pour la production
def get_cors_origins():
    """Get CORS origins from settings or default to localhost for dev"""
    if hasattr(settings, 'CORS_ORIGINS') and settings.CORS_ORIGINS:
        return [origin.strip() for origin in settings.CORS_ORIGINS.split(',')]
    return ["http://localhost:5173", "http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/")
async def accueil(request: Request):
    return {"Hello": "Welcome to ESAT-HUB API"}

@app.get("/health")
async def health_check():
    """Health check endpoint for production monitoring"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }

app.include_router(auth_router, prefix="/api/v1")
app.include_router(post_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(comment_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")
app.include_router(notif_router, prefix="/api/v1")
app.include_router(room_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
