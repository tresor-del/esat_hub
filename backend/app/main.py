import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager
from app.core.logging import setup_logging

setup_logging()
logger = logging.getLogger(__name__)

from app.db.database import Base, engine
from app.api.v1.auth import router as auth_router
from app.api.v1.post import router as post_router
from app.api.v1.users import router as users_router
from app.api.v1.search import router as search_router
from app.api.v1.files import router as files_router
from app.api.v1.comment import router as comment_router
from app.api.v1.ws import router as ws_router
from app.core.config import settings
from app.initial_data import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Connexion à l'api...")
    yield
    logger.info("Fermerture des connexions...")
    # à la création de engine, l'app crée une pool pour et stock des tuyaux ouverts vers la base de données. 
    # ça permet de réutiliser ces tuyaux pour les requêtes suivantes sans devoir se reconnecter à chaque fois, ce qui améliore les performances.
    # Quand l'app se ferme, il faut fermer ces tuyaux pour libérer les ressources
    engine.dispose()
    

app = FastAPI(title=settings.app_name)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def accueil(request: Request):
    return {"Hello"}

app.include_router(auth_router, prefix="/api/v1")
app.include_router(post_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(search_router, prefix="/api/v1")
app.include_router(files_router, prefix="/api/v1")
app.include_router(comment_router, prefix="/api/v1")
app.include_router(ws_router, prefix="/api/v1")
