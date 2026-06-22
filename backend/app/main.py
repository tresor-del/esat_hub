import logging
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

import redis.asyncio as aioredis

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from contextlib import asynccontextmanager

from app.api.v1 import router as api_v1_router
from app.core.logging import setup_logging
from app.db.database import Base, engine
from app.core.config import settings
from app.core.limiter import limiter
from app.core.firebase import init_firebase

if settings.ENV == "prod":
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        traces_sample_rate=1.0,
        integrations=[StarletteIntegration(), FastApiIntegration()]
    )

setup_logging()
logger = logging.getLogger(__name__)

REDIS_URL = settings.REDIS_URL

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connexion à l'api...")

    # initialisation de firebase
    init_firebase()

    # connexion à redis
    app.state.redis = await aioredis.from_url(REDIS_URL, decode_responses=True)
    
    yield
    logger.info("Fermerture des connexions...")

    # fermerture de la connexion avec redis
    await app.state.redis.close()

    # à la création de engine, l'app crée une pool pour et stock des tuyaux ouverts vers la base de données. 
    # ça permet de réutiliser ces tuyaux pour les requêtes suivantes sans devoir se reconnecter à chaque fois, ce qui améliore les performances.
    # Quand l'app se ferme, il faut fermer ces tuyaux pour libérer les ressources
    engine.dispose()
    

app = FastAPI(title=settings.APP_NAME, lifespan=lifespan)

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
    allow_methods=["*"],
    allow_headers=["*"],
)

# rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

BASE_DIR = settings.UPLOAD_DIR
app.mount("/static", StaticFiles(directory=BASE_DIR), name="uploads")

@app.get("/")
async def accueil(request: Request):
    return {"Hello": "Welcome to ESAT-HUB API"}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    """Health check endpoint for production monitoring"""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }

@app.get("/sentry-debug")
async def trigger_error():
    division_by_zero = 1 / 0

app.include_router(api_v1_router, prefix="/api/v1")