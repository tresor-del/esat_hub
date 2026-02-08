from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.db.database import Base, engine
from app.routers.auth import router as auth_router
from app.routers.post import app as post_router

templates = Jinja2Templates(directory="app/templates")

Base.metadata.create_all(engine)

app = FastAPI()
app.mount("/static", StaticFiles(directory="app/templates/static"), name="static")

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", response_class=HTMLResponse)
async def accueil(request: Request):
        return templates.TemplateResponse("layout.html", {"request": request, "titre": "Enrollix"})
    
app.include_router(auth_router)
app.include_router(post_router)
