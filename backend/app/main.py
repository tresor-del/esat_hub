import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

import redis.asyncio as aioredis

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.starlette import StarletteIntegration

from app.api.v1 import router as api_v1_router
from app.core.logging import setup_logging
from app.db.database import engine
from app.core.config import settings
from app.core.limiter import limiter
from app.core.firebase import init_firebase

# configuration sentry pour le monitoring
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

    # initialisation de firebase pour les notifications push
    init_firebase(logger=logger)

    # création de la connexion à redis et stockage dans l'état de l'app
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


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# montage du dossier de stockage des fichiers pour le dev.
if settings.ENV == "dev":
    BASE_DIR = settings.UPLOAD_DIR
    app.mount("/static", StaticFiles(directory=BASE_DIR), name="uploads")

@app.get("/")
async def accueil(request: Request):
    return {"Hello": "Welcome to ESAT-HUB API"}

@app.api_route("/health", methods=["GET", "HEAD"])
async def health_check():
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": "1.0.0"
    }

@app.get("/sentry-debug")
async def trigger_error():
    division_by_zero = 1 / 0

app.include_router(api_v1_router, prefix="/api/v1")
